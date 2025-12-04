from pymongo import MongoClient
import gridfs
from bson import ObjectId
import logging
import os
from typing import Optional, Tuple, List
import io

from dotenv import load_dotenv
from langchain_core.messages import HumanMessage, SystemMessage
from langchain_community.vectorstores import FAISS
from PyPDF2 import PdfReader
from langchain_core.documents import Document

def retrieve_file_by_id(mongo_uri: str, db_name: str, file_id: str) -> Tuple[Optional[bytes], Optional[str]]:
    """
    Retrieve file from GridFS directly using the GridFS file ID.
    file_id is the GridFS ID (uploads.files._id)
    """
    try:
        client = MongoClient(mongo_uri)
        db = client[db_name]
        
        # 1. Convert file_id string to ObjectId
        grid_fs_id = ObjectId(file_id)
        
        # 2. Access GridFS
        fs = gridfs.GridFS(db, collection="uploads")
        
        # 3. Check if file exists in GridFS
        if not fs.exists(grid_fs_id):
            logging.error(f"GridFS file with ID {file_id} not found.")
            return None, None
        
        # 4. Retrieve file from GridFS
        grid_out = fs.get(grid_fs_id)
        file_stream = grid_out.read()
        filename = grid_out.filename
        
        logging.info(f"Successfully retrieved file {filename} from GridFS")
        return file_stream, filename
        
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


def create_vector_store(documents: List[Document], api_key: str = None):
    """
    Create a FAISS vector store from documents.
    Uses Google Generative AI embeddings for consistency with Gemini.
    """
    try:
        from langchain_google_genai import GoogleGenerativeAIEmbeddings
        
        if not api_key:
            api_key = os.getenv('GOOGLE_API_KEY')
        
        if not api_key:
            logging.error("Google API key not found in environment.")
            return None
            
        embeddings = GoogleGenerativeAIEmbeddings(
            model="models/embedding-001",
            google_api_key=api_key
        )
        return FAISS.from_documents(documents, embeddings)
    except Exception as e:
        logging.error(f"Error creating vector store: {e}")
        return None
##############################################################
################### gemini pro correction code################
##############################################################

# def retrieve_file_by_id(mongo_uri: str, db_name: str, file_id_str: str) -> Tuple[Optional[bytes], Optional[str]]:
#     try:
#         # Note: In production, create the client ONCE globally, not inside the function.
#         client = MongoClient(mongo_uri)
#         db = client[db_name]
        
#         # 1. Convert String ID to ObjectId
#         mongoose_id = ObjectId(file_id_str)

#         # 2. Find the "Library Card" (Mongoose Document)
#         # Mongoose defaults collection names to lowercase plural: "File" -> "files"
#         mongoose_doc = db.files.find_one({"_id": mongoose_id})

#         if not mongoose_doc:
#             logging.error(f"Mongoose Document with ID {file_id_str} not found.")
#             return None, None

#         # 3. Get the "Vault Key" (gridFsId)
#         grid_fs_id = mongoose_doc.get("gridFsId")
#         if not grid_fs_id:
#             logging.error("Mongoose Document found, but 'gridFsId' is missing.")
#             return None, None

#         # 4. Access the "Vault" (GridFS)
#         # Note: collection="uploads" maps to uploads.files and uploads.chunks
#         fs = gridfs.GridFS(db, collection="uploads")
        
#         if not fs.exists(grid_fs_id):
#              logging.error(f"GridFS file with ID {grid_fs_id} not found.")
#              return None, None

#         # 5. Read the file
#         grid_out = fs.get(grid_fs_id)
#         file_stream = grid_out.read()
#         filename = mongoose_doc.get("filename", "unknown.pdf") # Use filename from Mongoose if possible
        
#         return file_stream, filename

#     except Exception as e:
#         logging.error(f"Error retrieving file: {e}")
#         return None, None