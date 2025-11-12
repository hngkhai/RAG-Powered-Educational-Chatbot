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
from langchain_core.messages import HumanMessage, SystemMessage
from langchain_openai import AzureChatOpenAI, AzureOpenAIEmbeddings
from langchain_community.vectorstores import FAISS
from PyPDF2 import PdfReader
from pymongo import MongoClient
import gridfs
import uvicorn

# Set up logging
logging.basicConfig(level=logging.INFO)
openai_api_key ="sk-"

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

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)