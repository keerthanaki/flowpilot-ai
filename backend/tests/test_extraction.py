from app import extraction
from app.extraction import extract_request, find_missing
from app.schemas import ExtractedRequest


def full_request(**overrides):
    data = dict(
        request_type="quotation",
        customer_name="Acme Traders",
        product="steel brackets",
        quantity=200,
        delivery_date="30 November 2026",
        customer_contact="ravi@acme.com",
    )
    data.update(overrides)
    return ExtractedRequest(**data)


def test_complete_request_has_nothing_missing():
    assert find_missing(full_request()) == []


def test_empty_request_reports_all_required_fields():
    result = find_missing(ExtractedRequest())
    assert result == [
        "customer_contact",
        "customer_name",
        "delivery_date",
        "product",
        "quantity",
    ]


def test_only_quantity_known():
    result = find_missing(ExtractedRequest(request_type="quotation", quantity=200))
    assert "quantity" not in result
    assert result == [
        "customer_contact",
        "customer_name",
        "delivery_date",
        "product",
    ]


def test_blank_text_counts_as_missing():
    assert find_missing(full_request(customer_name="   ")) == ["customer_name"]


def test_zero_quantity_counts_as_missing():
    assert find_missing(full_request(quantity=0)) == ["quantity"]


def test_extract_request_uses_llm_result_and_finds_missing(monkeypatch):
    fake = ExtractedRequest(request_type="quotation", quantity=200)
    monkeypatch.setattr(extraction, "ask_llm_structured", lambda prompt, schema: fake)

    extracted, missing = extract_request("A customer wants 200 units.")

    assert extracted.quantity == 200
    assert "customer_name" in missing
    assert "quantity" not in missing
