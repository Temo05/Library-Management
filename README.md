# Library Management API

REST API ბიბლიოთეკის მართვისთვის — **Node.js**, **Express**, **MongoDB** (Mongoose).

## პროექტის აღწერა

სისტემა მოიცავს წიგნების კატალოგს (ავტორები, კატეგორიები, წიგნები), წევრების რეგისტრაციას, წიგნების გასესხება/დაბრუნებას ვადაგადაცილების ჯარიმის ავტომატური დათვლით, რეზერვაციის სისტემას (როცა წიგნის ყველა ეგზემპლარი გასესხებულია), წევრების მიერ წიგნების შეფასება/კომენტირებას და ჯარიმების გადახდის აღრიცხვას. წვდომა სამ დონეზეა გათიშული როლის მიხედვით: **member** (ჩვეულებრივი მკითხველი), **librarian** (ბიბლიოთეკარი) და **admin**.

## როლები და უფლებები

| მოქმედება | member | librarian | admin |
|---|---|---|---|
| კატალოგის დათვალიერება (წიგნები/ავტორები/კატეგორიები) | ✅ | ✅ | ✅ |
| წიგნის გასესხება/დაბრუნება (საკუთარი) | ✅ | ✅ | ✅ |
| რეზერვაციის გაკეთება, წიგნის შეფასება (თუ ნასესხები გქონდა), საკუთარი ჯარიმის გადახდა | ✅ | ✅ | ✅ |
| ავტორის/კატეგორიის/წიგნის დამატება-რედაქტირება | ❌ | ✅ | ✅ |
| ნებისმიერი წევრის სახელით გასესხება, ყველა სესხების/გადახდის ნახვა, რეზერვაციის შესრულება | ❌ | ✅ | ✅ |
| წაშლა (წიგნი/ავტორი/კატეგორია), მომხმარებლების მართვა და როლის შეცვლა | ❌ | ❌ | ✅ |

რეგისტრაციისას ყველა ახალი მომხმარებელი ავტომატურად `member`-ი ხდება. `librarian`/`admin` როლით დარეგისტრირება შესაძლებელია მხოლოდ მაშინ, თუ მოთხოვნაში ერთვის სწორი `ADMIN_INVITE_CODE` (`.env`-დან) — ეს იცავს სისტემას იქიდან, რომ ვინმემ უბრალოდ request body-ში `role: "admin"` ჩაწერით თვითონ "აიმაღლოს" უფლებები.

## გამოყენებული ტექნოლოგიები

Node.js, Express, MongoDB/Mongoose, JWT, bcryptjs, express-validator, helmet/cors/express-rate-limit, morgan, Pug (მთავარი გვერდისთვის), Mocha+Chai+chai-http (ტესტირება).

## API Endpoints

### Auth — `/api/auth`
| მეთოდი | Endpoint | აღწერა |
|---|---|---|
| POST | `/register` | რეგისტრაცია (`name`, `email`, `password`, არასავალდებულო `role` + `inviteCode`) |
| POST | `/login` | შესვლა → აბრუნებს JWT-ს |
| GET | `/me` | შესული მომხმარებლის პროფილი |

### Users — `/api/users` (მხოლოდ admin)
`GET /`, `GET /:id`, `PUT /:id/role` (`{ role }`), `DELETE /:id`

### Authors — `/api/authors`
`GET /`, `GET /:id` — საჯარო. `POST /`, `PUT /:id` — librarian/admin. `DELETE /:id` — admin.

### Categories — `/api/categories`
იგივე წესი, რაც authors-ზე.

### Books — `/api/books`
`GET /?search=&category=&author=&available=true&sort=&page=&limit=` და `GET /:id` — საჯარო.
`GET /stats` — librarian/admin (კატეგორიების მიხედვით სტატისტიკა, aggregation-ით).
`POST /`, `PUT /:id` — librarian/admin. `DELETE /:id` — admin.

### Loans — `/api/loans` (ყველა route საჭიროებს login-ს)
| მეთოდი | Endpoint | აღწერა |
|---|---|---|
| POST | `/` | წიგნის გასესხება (`{ bookId }`, staff-ს შეუძლია `memberId`-იც) |
| PUT | `/:id/return` | წიგნის დაბრუნება, ჯარიმის ავტომატური დათვლა |
| GET | `/my` | ჩემი სესხებები |
| GET | `/` | ყველა სესხება (librarian/admin) |
| GET | `/overdue` | ვადაგადაცილებული სესხებები + დათვლილი ჯარიმა (librarian/admin) |
| GET | `/stats` | სტატუსების მიხედვით + ტოპ 5 ნასესხები წიგნი (librarian/admin) |

### Reservations — `/api/reservations`
`POST /` (`{ bookId }`), `GET /my`, `GET /` (librarian/admin), `DELETE /:id` (გაუქმება), `PUT /:id/fulfill` (librarian/admin)

### Reviews — `/api/reviews`
| მეთოდი | Endpoint | აღწერა |
|---|---|---|
| GET | `/book/:bookId` | წიგნის ყველა შეფასება + საშუალო რეიტინგი (საჯარო) |
| GET | `/my` | ჩემი შეფასებები |
| POST | `/` | შეფასების დატოვება (`{ bookId, rating, comment }`) - მხოლოდ თუ ეს წიგნი ოდესმე გესესხა |
| PUT | `/:id` | საკუთარი შეფასების რედაქტირება |
| DELETE | `/:id` | წაშლა (საკუთარი, ან librarian/admin - ნებისმიერი) |

### Payments — `/api/payments`
| მეთოდი | Endpoint | აღწერა |
|---|---|---|
| POST | `/` | ჯარიმის გადახდის რეგისტრაცია (`{ loanId, method }`) |
| GET | `/my` | ჩემი გადახდების ისტორია |
| GET | `/` | ყველა გადახდა (librarian/admin) |
| GET | `/outstanding` | გადაუხდელი ჯარიმების სია (librarian/admin) |
| GET | `/stats` | სულ შემოსული თანხა + თვეების მიხედვით (librarian/admin) |

## ბიზნეს-წესები

- წიგნის გასესხების ვადა: `LOAN_PERIOD_DAYS` (default 14 დღე)
- ვადაგადაცილების ჯარიმა: `FINE_PER_DAY` (default 1 ლარი/დღე), ავტომატურად ითვლება დაბრუნებისას
- წევრს არ შეუძლია ერთი და იგივე წიგნის ორჯერ სესხება, სანამ არ დააბრუნებს
- წევრს აქვს მაქსიმალური აქტიური სესხების ლიმიტი (`maxActiveLoans`, default 5)
- რეზერვაცია შესაძლებელია მხოლოდ მაშინ, თუ წიგნის ყველა ეგზემპლარი გასესხებულია
- შეფასების დატოვება შესაძლებელია მხოლოდ იმ წიგნზე, რომელიც წევრს ოდესმე ჰქონდა ნასესხები; ერთი წევრი - ერთი შეფასება თითო წიგნზე
- ჯარიმის გადახდა იხსნება მხოლოდ მაშინ, თუ `Loan.fine > 0` და ჯერ არ არის გადახდილი (`finePaid: false`)

## სამუშაოს გადანაწილება (4 წევრი)

პროექტი 4 დამოუკიდებელ ფუნქციურ ბლოკადაა აგებული, რომელთა ცალ-ცალკე დამუშავება და commit-ი შესაძლებელია:

1. **ავტორიზაცია/მომხმარებლები** — `models/User.js`, `controllers/authController.js`, `controllers/userController.js`, `middleware/authMiddleware.js`, `routes/authRoutes.js`, `routes/userRoutes.js`
2. **კატალოგი** — `models/Author.js`, `models/Category.js`, `models/Book.js`, შესაბამისი controllers/routes
3. **გასესხება/რეზერვაცია** — `models/Loan.js`, `models/Reservation.js`, `loanController.js`, `reservationController.js` და მათი routes
4. **შეფასებები/გადახდები** — `models/Review.js`, `models/Payment.js`, `reviewController.js`, `paymentController.js` და მათი routes

თითოეულმა წევრმა საკუთარი ბლოკი ცალკე feature branch-ზე დაამუშავოს და საკუთარი git identity-დან (`git config user.name/user.email`) დააკომიტოს, რომ commit history-ში ნათლად ჩანდეს ინდივიდუალური წვლილი.

## ავტორები

- Temuri Jibgashvili
- Giorgi Gegenava
- Nikoloz Phirosmanashvili
- Giorgi Kiparoidze
