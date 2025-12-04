from pymongo import MongoClient
import gridfs
from bson import ObjectId
import logging
from typing import  Optional, Tuple,List
import io
import logging



from bson import ObjectId
from dotenv import load_dotenv
from langchain_core.documents import Document
from langchain_core.messages import HumanMessage, SystemMessage
from langchain_community.vectorstores import FAISS
from PyPDF2 import PdfReader
from pymongo import MongoClient
import gridfs
import uvicorn
# from langchain_openai import AzureChatOpenAI, AzureOpenAIEmbeddings

def retrieve_file_by_id(mongo_uri: str, db_name: str, file_id: str) -> Tuple[Optional[bytes], Optional[str]]:
    try:
        client = MongoClient(mongo_uri)
        db = client[db_name]
        fs = gridfs.GridFS(db, collection="uploads")
        file_id = ObjectId(file_id)
        file_metadata = db.uploads.files.find_one({"_id": file_id})
        if not file_metadata:
            logging.error("File not found in `uploads.files`.")
            return None, None
        file_stream = fs.get(file_id).read()
        return file_stream, file_metadata["filename"]
    except Exception as e:
        logging.error(f"Error retrieving file: {e}")
        return None, None
    
def extract_text_from_pdf(file_stream: bytes) -> List[Document]:
    pdf_reader = PdfReader(io.BytesIO(file_stream))
    documents = []
    for page_num, page in enumerate(pdf_reader.pages):
        text = page.extract_text()
        if text:
            documents.append(Document(page_content=text, metadata={"page": page_num + 1, "source": "PDF"}))
    return documents


def search_chunks(retriever, query: str) -> SystemMessage:
    search_result = retriever.invoke(query)
    context_texts = [r.page_content for r in search_result]
    instruction = "Use the context below to generate a quiz that fits the provided parameters.\n"
    return SystemMessage(content=f"{instruction}Context: {context_texts}\nUser Query: {query}")
