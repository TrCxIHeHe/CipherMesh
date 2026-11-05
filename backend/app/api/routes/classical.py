from fastapi import APIRouter, HTTPException, status
from app.crypto.educational.classical.caesar import caesar_cipher
from app.crypto.educational.classical.monoalphabetic import (
    generate_substitution_alphabet,
    get_alphabet_mapping,
    monoalphabetic_cipher,
)
from app.crypto.educational.classical.playfair import playfair_cipher
from app.crypto.educational.classical.hill import hill_cipher
from app.crypto.educational.classical.vigenere import vigenere_cipher
from app.crypto.educational.classical.one_time_pad import (
    generate_otp_key,
    otp_cipher,
    demonstrate_key_reuse,
)
from app.schemas.classical import (
    CaesarRequest,
    CaesarResponse,
    MonoalphabeticKeyResponse,
    MonoalphabeticRequest,
    MonoalphabeticResponse,
    PlayfairRequest,
    PlayfairResponse,
    HillRequest,
    HillResponse,
    VigenereRequest,
    VigenereResponse,
    OTPGenerateKeyRequest,
    OTPGenerateKeyResponse,
    OTPRequest,
    OTPResponse,
    OTPReuseRequest,
    OTPReuseResponse,
)

router = APIRouter(prefix="/lab/classical", tags=["Classical Cryptography"])


# Caesar Cipher
@router.post("/caesar/encrypt", response_model=CaesarResponse, summary="Encrypt with Caesar Cipher")
def caesar_encrypt_endpoint(req: CaesarRequest):
    try:
        return caesar_cipher(text=req.text, shift=req.shift, decrypt=False)
    except ValueError as err:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(err))


@router.post("/caesar/decrypt", response_model=CaesarResponse, summary="Decrypt with Caesar Cipher")
def caesar_decrypt_endpoint(req: CaesarRequest):
    try:
        return caesar_cipher(text=req.text, shift=req.shift, decrypt=True)
    except ValueError as err:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(err))


# Monoalphabetic Cipher
@router.get("/monoalphabetic/generate-key", response_model=MonoalphabeticKeyResponse, summary="Generate Monoalphabetic Key")
def mono_generate_key_endpoint():
    key = generate_substitution_alphabet()
    return MonoalphabeticKeyResponse(key=key, alphabet_mapping=get_alphabet_mapping(key))


@router.post("/monoalphabetic/encrypt", response_model=MonoalphabeticResponse, summary="Encrypt with Monoalphabetic Cipher")
def mono_encrypt_endpoint(req: MonoalphabeticRequest):
    try:
        return monoalphabetic_cipher(text=req.text, key=req.key, decrypt=False)
    except ValueError as err:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(err))


@router.post("/monoalphabetic/decrypt", response_model=MonoalphabeticResponse, summary="Decrypt with Monoalphabetic Cipher")
def mono_decrypt_endpoint(req: MonoalphabeticRequest):
    try:
        return monoalphabetic_cipher(text=req.text, key=req.key, decrypt=True)
    except ValueError as err:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(err))


# Playfair Cipher
@router.post("/playfair/encrypt", response_model=PlayfairResponse, summary="Encrypt with Playfair Cipher")
def playfair_encrypt_endpoint(req: PlayfairRequest):
    try:
        return playfair_cipher(text=req.text, key=req.key, decrypt=False)
    except ValueError as err:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(err))


@router.post("/playfair/decrypt", response_model=PlayfairResponse, summary="Decrypt with Playfair Cipher")
def playfair_decrypt_endpoint(req: PlayfairRequest):
    try:
        return playfair_cipher(text=req.text, key=req.key, decrypt=True)
    except ValueError as err:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(err))


# Hill Cipher
@router.post("/hill/encrypt", response_model=HillResponse, summary="Encrypt with Hill Cipher")
def hill_encrypt_endpoint(req: HillRequest):
    try:
        return hill_cipher(text=req.text, key_matrix=req.matrix, decrypt=False)
    except ValueError as err:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(err))


@router.post("/hill/decrypt", response_model=HillResponse, summary="Decrypt with Hill Cipher")
def hill_decrypt_endpoint(req: HillRequest):
    try:
        return hill_cipher(text=req.text, key_matrix=req.matrix, decrypt=True)
    except ValueError as err:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(err))


# Vigenere Cipher
@router.post("/vigenere/encrypt", response_model=VigenereResponse, summary="Encrypt with Vigenere Cipher")
def vigenere_encrypt_endpoint(req: VigenereRequest):
    try:
        return vigenere_cipher(text=req.text, key=req.key, decrypt=False)
    except ValueError as err:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(err))


@router.post("/vigenere/decrypt", response_model=VigenereResponse, summary="Decrypt with Vigenere Cipher")
def vigenere_decrypt_endpoint(req: VigenereRequest):
    try:
        return vigenere_cipher(text=req.text, key=req.key, decrypt=True)
    except ValueError as err:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(err))


# One-Time Pad
@router.post("/otp/generate-key", response_model=OTPGenerateKeyResponse, summary="Generate One-Time Pad Key")
def otp_generate_key_endpoint(req: OTPGenerateKeyRequest):
    try:
        key = generate_otp_key(req.length)
        return OTPGenerateKeyResponse(key=key, length=len(key))
    except ValueError as err:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(err))


@router.post("/otp/encrypt", response_model=OTPResponse, summary="Encrypt with One-Time Pad")
def otp_encrypt_endpoint(req: OTPRequest):
    try:
        return otp_cipher(text=req.text, key=req.key)
    except ValueError as err:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(err))


@router.post("/otp/decrypt", response_model=OTPResponse, summary="Decrypt with One-Time Pad")
def otp_decrypt_endpoint(req: OTPRequest):
    try:
        return otp_cipher(text=req.text, key=req.key)
    except ValueError as err:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(err))


@router.post("/otp/reuse-demonstration", response_model=OTPReuseResponse, summary="Demonstrate OTP Key Reuse Flaw")
def otp_reuse_endpoint(req: OTPReuseRequest):
    try:
        return demonstrate_key_reuse(plaintext1=req.plaintext1, plaintext2=req.plaintext2, key=req.key)
    except ValueError as err:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(err))

