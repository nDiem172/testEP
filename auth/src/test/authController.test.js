const chai = require("chai");
const chaiHttp = require("chai-http");
const App = require("../app");
const mongoose = require("mongoose");
require("dotenv").config();

chai.use(chaiHttp);
const { expect } = chai;

describe("User Authentication", () => {
  let app;

  before(async () => {
    app = new App();

    // Kết nối MongoDB
    await app.connectDB();

    // Chờ Mongoose thực sự sẵn sàng
    while (mongoose.connection.readyState !== 1) {
      console.log("Waiting for MongoDB...");
      await new Promise(res => setTimeout(res, 100));
    }
    console.log("✅ MongoDB connected");

    // Xóa user test trước khi chạy
    await app.authController.authService.deleteTestUsers();

    app.start();

  });

  after(async () => {
    // Cleanup dữ liệu test
    await app.authController.authService.deleteTestUsers();

    await app.disconnectDB();
    app.stop();
  });

  describe("POST /register", () => {
    it("should register a new user", async () => {
      const res = await chai
        .request(app.app)
        .post("/register")
        .send({ username: "testuser", password: "password" });

      expect(res).to.have.status(200);
      expect(res.body).to.have.property("_id");
      expect(res.body).to.have.property("username", "testuser");
    });

    it("should return an error if the username is already taken", async () => {
      const res = await chai
        .request(app.app)
        .post("/register")
        .send({ username: "testuser", password: "password" });

      expect(res).to.have.status(400);
      expect(res.body).to.have.property("message", "Username already taken");
    });
  });

  describe("POST /login", () => {
    it("should return a JWT token for a valid user", async () => {
      const res = await chai
        .request(app.app)
        .post("/login")
        .send({ username: "testuser", password: "password" });

      expect(res).to.have.status(200);
      expect(res.body).to.have.property("token");
    });

    it("should return an error for an invalid user", async () => {
      const res = await chai
        .request(app.app)
        .post("/login")
        .send({ username: "invaliduser", password: "password" });

      expect(res).to.have.status(400);
      expect(res.body).to.have.property("message", "Invalid username or password");
    });

    it("should return an error for an incorrect password", async () => {
      const res = await chai
        .request(app.app)
        .post("/login")
        .send({ username: "testuser", password: "wrongpassword" });

      expect(res).to.have.status(400);
      expect(res.body).to.have.property("message", "Invalid username or password");
    });
  });
});
