from pymongo import MongoClient
def get_db_collection(uri: str, db_name: str, collection_name: str):
    client = MongoClient(uri)
    db = client[db_name]
    return db[collection_name]
