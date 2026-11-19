"""Whisker Quest: the party. One entry per cat: its id (the sprite sheet build/gen/<id>.png and the font
WhiskerDot<v>-<id>.ttf), name, role, how it attacks (bolt | slash | holy), its magic colors (core, glow, deep), its
special move (name, how it plays: plan.js SPECIALS) and its UI color (the card's name). The mods keep the same list
in lib.js ROSTER."""


class Cat:
    def __init__(self, id, name, role, style, magic, special, color):
        self.id, self.name, self.role, self.style = id, name, role, style
        self.magic, self.special, self.color = magic, special, color


CATS = [
    Cat('mochi', 'Mochi', 'Wizard', 'bolt', ('#ffffff', '#ffb070', '#e0602a'), ('COSMIC MEOW', 'beam'), '#ffb070'),
    Cat('tiger', 'Tiger', 'Warrior', 'slash', ('#fff4dc', '#ffb24a', '#d4621c'), ('TIGER CLAW', 'cuts'), '#ffb24a'),
    Cat('earl', 'Earl Grey', 'Knight', 'slash', ('#ffffff', '#a6dcff', '#3b7fe0'), ('SKY POUNCE', 'skysplit'), '#86b4ff'),
    Cat('butter', 'Butter', 'Cleric', 'holy', ('#fffbe2', '#ffe27a', '#d6a21c'), ('HOLY PURR', 'sanctuary'), '#ffe27a'),
    Cat('hazel', 'Hazel', 'Ranger', 'bolt', ('#efffef', '#8fe7a0', '#2f9e55'), ('ARROW RAIN', 'rain'), '#8fe39b'),
    Cat('shadow', 'Shadow', 'Rogue', 'slash', ('#eafffb', '#80e3d3', '#279c8e'), ('NINE LIVES', 'mirror'), '#80e3d3'),
    Cat('sakura', 'Sakura', 'Samurai', 'slash', ('#fff0fa', '#ff9ad6', '#c2489a'), ('PETAL FLASH', 'flash'), '#ffb0dc'),
    Cat('pumpkin', 'Pumpkin', 'Witch', 'bolt', ('#fff5d8', '#ffc25c', '#e0622a'), ('CATNIP STORM', 'tornado'), '#ffc25c'),
    Cat('pudding', 'Pudding', 'Monk', 'slash', ('#fff4dc', '#ffb24a', '#d4621c'), ('HAIRBALL QUAKE', 'quake'), '#ffa070'),
    Cat('pepper', 'Pepper', 'Storm Mage', 'bolt', ('#ffffff', '#fff27a', '#c9a22e'), ('THUNDERPAW', 'thunder'), '#fff27a'),
    Cat('biscuit', 'Biscuit', 'Frost Mage', 'bolt', ('#f2ffff', '#a8f2ff', '#4cb6d8'), ('ICE WHISKERS', 'ice'), '#a8f2ff'),
    Cat('nori', 'Nori', 'Pirate', 'slash', ('#eaf7ff', '#7cc4ff', '#2f74d0'), ('FISH TIDE', 'tide'), '#7cc4ff'),
]
