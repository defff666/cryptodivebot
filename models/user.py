from dataclasses import dataclass

@dataclass
class User:
    user_id: int
    nickname: str
    age: int
    country: str
    city: str
    gender: str
    interests: list
    photo_url: str = None
    coins: int = 10
    blocked: bool = False
    likes: list = None
    matches: list = None
