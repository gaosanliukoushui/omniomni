import requests

from config import HTTP_TIMEOUT_SECONDS, STATUS_ENDPOINT


def update_status(doc_id, status: int, error_msg=None) -> None:
    # Java endpoint expects:
    # {
    #   "docId": ...,
    #   "status": 1..4,
    #   "errorMsg": "..."
    # }
    req_body = {
        "docId": int(doc_id) if str(doc_id).isdigit() else doc_id,
        "status": status,
        "errorMsg": error_msg,
    }
    resp = requests.post(STATUS_ENDPOINT, json=req_body, timeout=HTTP_TIMEOUT_SECONDS)
    resp.raise_for_status()

