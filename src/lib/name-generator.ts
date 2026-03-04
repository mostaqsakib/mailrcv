// Diverse collection of first names from various regions
const firstNames = [
  "james", "john", "robert", "michael", "david", "william", "richard", "joseph", "thomas", "christopher",
  "mary", "patricia", "jennifer", "linda", "elizabeth", "barbara", "susan", "jessica", "sarah", "karen",
  "daniel", "matthew", "anthony", "mark", "donald", "steven", "paul", "andrew", "joshua", "kenneth",
  "emma", "olivia", "sophia", "isabella", "mia", "charlotte", "amelia", "harper", "evelyn", "abigail",
  "carlos", "miguel", "jose", "juan", "luis", "diego", "alejandro", "gabriel", "rafael", "pablo",
  "maria", "carmen", "rosa", "lucia", "elena", "sofia", "valentina", "camila", "mariana", "isabella",
  "lucas", "liam", "noah", "oliver", "felix", "max", "leon", "theo", "oscar", "hugo",
  "anna", "julia", "laura", "clara", "marie", "nina", "eva", "lisa", "sara", "hanna",
  "wei", "chen", "ming", "jin", "hao", "yan", "lei", "feng", "yuki", "kenji",
  "mei", "lin", "xiao", "ying", "sakura", "hana", "yuna", "mina", "sora", "aiko",
  "omar", "ali", "ahmed", "hassan", "karim", "tariq", "malik", "yusuf", "amir", "rami",
  "fatima", "layla", "amira", "nadia", "sara", "leila", "yasmin", "zahra", "dina", "rania",
  "arjun", "raj", "vikram", "arun", "rohan", "kiran", "sanjay", "amit", "rahul", "varun",
  "priya", "ananya", "divya", "neha", "riya", "pooja", "shreya", "kavya", "aisha", "zara",
  "kwame", "kofi", "adebayo", "chidi", "emeka", "olu", "sekou", "amadou", "mamadou", "ibrahima",
  "amara", "ayana", "zuri", "nia", "imani", "adaora", "chiamaka", "folake", "ngozi", "adeola"
];

const lastNames = [
  "smith", "johnson", "williams", "brown", "jones", "garcia", "miller", "davis", "rodriguez", "martinez",
  "wilson", "anderson", "taylor", "thomas", "hernandez", "moore", "martin", "jackson", "thompson", "white",
  "mueller", "schmidt", "schneider", "fischer", "weber", "meyer", "wagner", "becker", "hoffmann", "schulz",
  "rossi", "russo", "ferrari", "esposito", "bianchi", "romano", "colombo", "ricci", "marino", "greco",
  "dubois", "moreau", "laurent", "simon", "michel", "leroy", "roux", "david", "bertrand", "morel",
  "gonzalez", "lopez", "perez", "sanchez", "ramirez", "torres", "flores", "rivera", "gomez", "diaz",
  "wang", "li", "zhang", "liu", "chen", "yang", "huang", "zhao", "wu", "zhou",
  "kim", "lee", "park", "choi", "jung", "kang", "cho", "yoon", "jang", "lim",
  "tanaka", "yamamoto", "suzuki", "watanabe", "ito", "yamada", "nakamura", "kobayashi", "kato", "yoshida",
  "patel", "sharma", "singh", "kumar", "gupta", "das", "reddy", "khan", "ali", "malik",
  "okonkwo", "adeyemi", "mensah", "diallo", "traore", "coulibaly", "ndiaye", "sy", "ba", "sow"
];

export const generateRandomName = () => {
  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
  const patterns = [
    () => `${firstName}.${lastName}`,
    () => `${firstName}${lastName}`,
    () => `${firstName}_${lastName}`,
    () => `${firstName}.${lastName}${Math.floor(Math.random() * 99) + 1}`,
    () => `${firstName}${Math.floor(Math.random() * 999) + 1}`,
    () => `${firstName[0]}${lastName}`,
    () => `${firstName}${lastName[0]}`,
    () => `${firstName}.${lastName[0]}`,
    () => `${lastName}.${firstName}`,
  ];
  return patterns[Math.floor(Math.random() * patterns.length)]();
};

export const generateStrongPassword = () => {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%";
  let password = "";
  for (let i = 0; i < 16; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};
