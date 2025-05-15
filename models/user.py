from dataclasses import dataclass
from typing import List, Optional

@dataclass
class User:
    id: int
    nickname: str
    age: int
    country: str
    city: str
    gender: str
    interests: str
    photo: Optional[str] = None
    coins: int = 0
    likes: List[str] = None
    matches: List[str] = None
    blocked: bool = False

    def __post_init__(self):
        self.likes = self.likes or []
        self.matches = self.matches or []