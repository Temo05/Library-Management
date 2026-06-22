const chai = require('chai');
const chaiHttp = require('chai-http');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

dotenv.config();

chai.use(chaiHttp);
const expect = chai.expect;

const app = require('../app');

describe('Library Management API ტესტები', () => {
  before(async function () {
    this.timeout(15000);
    await mongoose.connect(process.env.MONGO_URI);
  });

  after(async () => {
    await mongoose.connection.close();
  });

  const suffix = Date.now();
  let librarianToken, memberToken, memberId;
  let categoryId, authorId, bookId, loanId, fineLoanId;

  describe('ავტორიზაცია', () => {
    it('librarian დარეგისტრირდება სწორი invite code-ით', (done) => {
      chai
        .request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test Librarian',
          email: `librarian_${suffix}@test.com`,
          password: '123456',
          role: 'librarian',
          inviteCode: process.env.ADMIN_INVITE_CODE,
        })
        .end((err, res) => {
          expect(err).to.be.null;
          expect(res).to.have.status(201);
          expect(res.body.data.role).to.equal('librarian');
          librarianToken = res.body.data.token;
          done();
        });
    });

    it('role იძულებით "member" ხდება არასწორი invite code-ის შემთხვევაში', (done) => {
      chai
        .request(app)
        .post('/api/auth/register')
        .send({
          name: 'Fake Admin',
          email: `fakeadmin_${suffix}@test.com`,
          password: '123456',
          role: 'admin',
          inviteCode: 'wrong-code',
        })
        .end((err, res) => {
          expect(err).to.be.null;
          expect(res.body.data.role).to.equal('member');
          done();
        });
    });

    it('member დარეგისტრირდება ჩვეულებრივად', (done) => {
      chai
        .request(app)
        .post('/api/auth/register')
        .send({ name: 'Test Member', email: `member_${suffix}@test.com`, password: '123456' })
        .end((err, res) => {
          expect(err).to.be.null;
          expect(res).to.have.status(201);
          memberToken = res.body.data.token;
          memberId = res.body.data._id;
          done();
        });
    });
  });

  describe('კატალოგის მართვა (librarian)', () => {
    it('librarian ქმნის კატეგორიას', (done) => {
      chai
        .request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${librarianToken}`)
        .send({ name: `Fiction_${suffix}` })
        .end((err, res) => {
          expect(res).to.have.status(201);
          categoryId = res.body.data._id;
          done();
        });
    });

    it('member-ს არ შეუძლია კატეგორიის შექმნა (403)', (done) => {
      chai
        .request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${memberToken}`)
        .send({ name: `ShouldFail_${suffix}` })
        .end((err, res) => {
          expect(res).to.have.status(403);
          done();
        });
    });

    it('librarian ქმნის ავტორს', (done) => {
      chai
        .request(app)
        .post('/api/authors')
        .set('Authorization', `Bearer ${librarianToken}`)
        .send({ name: `George Orwell ${suffix}` })
        .end((err, res) => {
          expect(res).to.have.status(201);
          authorId = res.body.data._id;
          done();
        });
    });

    it('librarian ქმნის წიგნს (1 ეგზემპლარით)', (done) => {
      chai
        .request(app)
        .post('/api/books')
        .set('Authorization', `Bearer ${librarianToken}`)
        .send({
          title: `1984_${suffix}`,
          isbn: `ISBN-${suffix}`,
          authors: [authorId],
          category: categoryId,
          totalCopies: 1,
        })
        .end((err, res) => {
          expect(res).to.have.status(201);
          expect(res.body.data.availableCopies).to.equal(1);
          bookId = res.body.data._id;
          done();
        });
    });
  });

  describe('გასესხება/დაბრუნება (member)', () => {
    it('member სესხულობს წიგნს', (done) => {
      chai
        .request(app)
        .post('/api/loans')
        .set('Authorization', `Bearer ${memberToken}`)
        .send({ bookId })
        .end((err, res) => {
          expect(res).to.have.status(201);
          loanId = res.body.data._id;
          done();
        });
    });

    it('წიგნი აღარ არის ხელმისაწვდომი მეორედ გასასესხებლად', (done) => {
      chai
        .request(app)
        .get(`/api/books/${bookId}`)
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body.data.availableCopies).to.equal(0);
          done();
        });
    });

    it('member აბრუნებს წიგნს', (done) => {
      chai
        .request(app)
        .put(`/api/loans/${loanId}/return`)
        .set('Authorization', `Bearer ${memberToken}`)
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body.data.status).to.equal('returned');
          done();
        });
    });

    it('წიგნი ისევ ხელმისაწვდომია დაბრუნების შემდეგ', (done) => {
      chai
        .request(app)
        .get(`/api/books/${bookId}`)
        .end((err, res) => {
          expect(res.body.data.availableCopies).to.equal(1);
          done();
        });
    });
  });

  describe('შეფასებები (reviews)', () => {
    let reviewId;

    it('member ტოვებს შეფასებას წიგნზე, რომელიც ნასესხები ჰქონდა', (done) => {
      chai
        .request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${memberToken}`)
        .send({ bookId, rating: 5, comment: 'შესანიშნავი წიგნია' })
        .end((err, res) => {
          expect(res).to.have.status(201);
          reviewId = res.body.data._id;
          done();
        });
    });

    it('იგივე წევრი ვერ დატოვებს მეორე შეფასებას იმავე წიგნზე', (done) => {
      chai
        .request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${memberToken}`)
        .send({ bookId, rating: 3 })
        .end((err, res) => {
          expect(res).to.have.status(400);
          done();
        });
    });

    it('GET /api/reviews/book/:bookId აბრუნებს საშუალო შეფასებას', (done) => {
      chai
        .request(app)
        .get(`/api/reviews/book/${bookId}`)
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body.avgRating).to.equal(5);
          expect(res.body.count).to.equal(1);
          done();
        });
    });
  });

  describe('ჯარიმები და გადახდები (payments)', () => {
    it('ვადაგადაცილებული სესხების დაბრუნებისას ჯარიმა ერიცხება', async () => {
      const fiveDaysAgo = new Date();
      fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);

      const loanRes = await chai
        .request(app)
        .post('/api/loans')
        .set('Authorization', `Bearer ${librarianToken}`)
        .send({ bookId, memberId, dueDate: fiveDaysAgo.toISOString() });

      expect(loanRes).to.have.status(201);
      fineLoanId = loanRes.body.data._id;

      const returnRes = await chai
        .request(app)
        .put(`/api/loans/${fineLoanId}/return`)
        .set('Authorization', `Bearer ${memberToken}`);

      expect(returnRes).to.have.status(200);
      expect(returnRes.body.data.fine).to.be.greaterThan(0);
    });

    it('member იხდის ჯარიმას', (done) => {
      chai
        .request(app)
        .post('/api/payments')
        .set('Authorization', `Bearer ${memberToken}`)
        .send({ loanId: fineLoanId })
        .end((err, res) => {
          expect(res).to.have.status(201);
          done();
        });
    });

    it('ხელახლა იგივე ჯარიმის გადახდა ვერ მოხერხდება', (done) => {
      chai
        .request(app)
        .post('/api/payments')
        .set('Authorization', `Bearer ${memberToken}`)
        .send({ loanId: fineLoanId })
        .end((err, res) => {
          expect(res).to.have.status(400);
          done();
        });
    });

    it('librarian ხედავს გადახდების სტატისტიკას', (done) => {
      chai
        .request(app)
        .get('/api/payments/stats')
        .set('Authorization', `Bearer ${librarianToken}`)
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body.data.totalCollected).to.be.greaterThan(0);
          done();
        });
    });
  });
});