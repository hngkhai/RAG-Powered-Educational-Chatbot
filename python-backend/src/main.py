import io
import json
import os
import logging
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple, Union

from bson import ObjectId
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Body, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from langchain_core.documents import Document
# from langchain_openai import AzureChatOpenAI, AzureOpenAIEmbeddings
from langchain_community.vectorstores import FAISS
from PyPDF2 import PdfReader
from pymongo import MongoClient
import gridfs
import uvicorn
from langchain_google_genai import ChatGoogleGenerativeAI


from pydantic import BaseModel
class QuizRequest(BaseModel):
    question: str
    fileId: str


# Set up logging
logging.basicConfig(level=logging.INFO)

from modules.chatbot import run_application
load_dotenv(dotenv_path='.env')
GOOGLE_API_KEY = os.getenv('GOOGLE_API_KEY')
# openai_api_key ="sk-"

app = FastAPI()

origins = [
    "http://localhost:5173",
    "localhost:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Root endpoint for testing.
@app.get("/")
async def read_root():
    return {"message": "FastAPI backend with MongoDB integration is running."}

@app.post("/generate-quiz")
async def chat_endpoint(request: QuizRequest):
    result = run_application(
        mongo_uri=os.getenv("MONGO_URI"),
        db_name="test", # Your DB Name
        file_id=request.fileId,
        query=request.question,
        api_key=GOOGLE_API_KEY 
    )
        
    return result


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)