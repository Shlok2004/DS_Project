from fastapi import APIRouter, HTTPException
from fastapi.concurrency import run_in_threadpool
from pydantic import BaseModel, Field
import psycopg
import psycopg.rows
import json

router = APIRouter(
    prefix= "/supabase",
    tags = ["supabase"]
)

# ESTABLISH CONNECTOIN
connection = None

def set_connection(new_connection: psycopg.Connection):
    global connection
    connection = new_connection

# DATA VALIDATION SCHEMAS
class KeyDetails(BaseModel):
    event: str = ""
    victims: int = 0
    ongoing_threat: str = ""


class TableEntry(BaseModel):
    emotional_sev: float = 0.0
    context_sev: float = 0.0
    transcript: str = ""
    key_details: KeyDetails = Field(default_factory = KeyDetails)
    is_active: bool = True
    emotions: str = ""

# POST (ADD FULL RECORD)
def new_record(connection: psycopg.Connection, values: dict):
    details = values.copy()
    details['key_details'] = json.dumps(values['key_details'])
    query = """
        insert into call_severities (emotional_sev, context_sev, transcript, key_details, is_active, emotions)
        values (%(emotional_sev)s, %(context_sev)s, %(transcript)s, %(key_details)s, %(is_active)s, %(emotions)s)
        returning id
    """

    with connection.cursor() as curs:
        curs.execute(query, details)
        entry_id = curs.fetchone()[0]
        connection.commit()
        return entry_id

@router.post("/", summary = "Add new processed call entry")
async def add_new_call(call: TableEntry):
    if connection is None:
        raise HTTPException(status_code = 503, detail = "No database connection")
    try:
        return await run_in_threadpool(new_record, connection, call.model_dump())
    except Exception as e:
        raise HTTPException(status_code = 500, detail = f"Insertion failed: {e}")
    
# GET (ALL ACTIVE RECORDS)
def records_by_active(connection: psycopg.Connection, is_active: bool):
    query = """select * from call_severities where is_active = %(is_active)s;"""
    clean_json_recs = []

    with connection.cursor(row_factory = psycopg.rows.dict_row) as curs:
        curs.execute(query, {'is_active': is_active})
        raw_json_recs = curs.fetchall()

        for entry in raw_json_recs:
            if isinstance(entry['key_details'], str):
                entry['key_details'] = json.loads(entry['key_details'])
            clean_json_recs.append(entry)
        return clean_json_recs

@router.get("/active", summary = "Get active records")
async def get_active():
    if connection is None:
        raise HTTPException(status_code = 503, detail = "No database connection")
    try:
        return await run_in_threadpool(records_by_active, connection, True)
    except Exception as e:
        raise HTTPException(status_code = 500, detail = f"Error while querying: {e}")
    
# ------------------ BELOW WERE IMIPLEMENTED TESTED AND FUNCTIONAL BUT RAN OUT OF TIME TO INTEGRATE INTO FRONTEND -----------

# GET (ALL INACTIVE RECORDS)
@router.get("/inactive", summary = "Get inactive records")
async def get_inactive():
    if connection is None:
        raise HTTPException(status_code = 503, detail = "No database connection")
    try:
        return await run_in_threadpool(records_by_active, connection, False)
    except Exception as e:
        raise HTTPException(status_code = 500, detail = f"Error while querying: {e}")

# DELETE (REMOVE A RECORD)
def delete_call(connection: psycopg.Connection, id: int):
    query = """
        delete from call_severities
        where id = %(id)s;
    """

    with connection.cursor() as curs:
        curs.execute(query, {'id': id})
        connection.commit()

@router.delete("/{id}", summary = "Delete a call")
async def delete_record(id: int):
    if connection is None:
        raise HTTPException(status_code = 503, detail = "No database connection")
    try:
        await run_in_threadpool(delete_call, connection, id)
        return "Record successfully deleted"
    except Exception as e:
        raise HTTPException(status_code = 500, detail = f"Delete failed, or invalid call id: {e}")

# UPDATE (MAKE A RECORD INACTIVE)
def add_to_archive(connection: psycopg.Connection, id: int):
    query = """
        update call_severities
        set is_active = false
        where id = %(id)s
        returning id;
    """

    with connection.cursor() as curs:
        curs.execute(query, {'id': id})
        connection.commit()

@router.put("/archive/{call_id}", summary = "Archive a call")
async def archive_record(call_id: int):
    if connection is None:
        raise HTTPException(status_code = 503, detail = "No database connection")
    try:
        await run_in_threadpool(add_to_archive, connection, call_id)
        return "Record successfully archived"
    except Exception as e:
        raise HTTPException(status_code = 500, detail = f"Update failed: {e}")
    