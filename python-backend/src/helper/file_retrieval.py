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
load_dotenv()
from langchain_huggingface import HuggingFaceEmbeddings
from sentence_transformers import SentenceTransformer
def retrieve_file_by_id(mongo_uri: str, db_name: str, file_id: str) -> Tuple[Optional[bytes], Optional[str]]:
    try:
        client = MongoClient(mongo_uri)
        db = client[db_name]
        
        # Ensure the ID is clean (remove spaces/newlines)
        clean_id = file_id.strip()
        grid_fs_id = ObjectId(clean_id)
        
        fs = gridfs.GridFS(db, collection="uploads")
        
        # --- DEBUG CHECK ---
        if not fs.exists(grid_fs_id):
            logging.error(f"❌ TARGET NOT FOUND: {clean_id}")
            
            # Count total files
            count = db["uploads.files"].count_documents({})
            logging.error(f"   Files in 'uploads' bucket: {count}")
            
            if count == 0:
                logging.error("   ⚠️ THE BUCKET IS EMPTY. You are definitely connected to the wrong Database.")
            else:
                logging.error("   ⚠️ Here are the first 3 IDs Python CAN see:")
                for file_doc in db["uploads.files"].find().limit(3):
                    logging.error(f"   - Found: {file_doc['_id']} | Name: {file_doc.get('filename')}")
            
            return None, None
        # -------------------

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
    instruction = "Use the context below to assist student to study and understand\n"
    return SystemMessage(content=f"{instruction}Context: {context_texts}\nUser Query: {query}")


def create_vector_store(documents: List[Document], api_key: str = None):
    """
    Create a FAISS vector store from documents.
    """
    try:
        embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
        return FAISS.from_documents(documents, embeddings)
    except Exception as e:
        logging.error(f"Error creating vector store: {e}")
        return None
