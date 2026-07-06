import express from "express";
import bodyParser from "body-parser";
import pg from "pg";

const app = express();
const port = 3000;

const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "world",
  password: "1234",
  port: 5433,
});
db.connect();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

let currentUserId = 1;
let users=[];
let result =await db.query("select * from users;");
users=result.rows;
let color = users[0].color;
app.get("/", async (req, res) => {
  const result = await db.query("SELECT country_code FROM visited_countries join users on users.id=user_id where user_id=$1;",
    [currentUserId]);
  let countries = [];
  for (let i = 0; i < result.rows.length; i++) {
    if(result.rows[i].country_code!='IO'){
      countries.push(result.rows[i].country_code);
    }
  }
  for (let i = 0; i < users.length; i++) {
    if (users[i].id == currentUserId) {
      color = users[i].color;
    }
  }
  let val=await db.query("select * from visited_countries where user_id=$1;",[currentUserId]);
  console.log(currentUserId);
  res.render("index.ejs", {
    countries: countries,
    total: countries.length,
    users: users,
    color: color,
  });
});
app.post("/add", async (req, res) => {
  const input = req.body["country"];

  try {
    const result = await db.query(
      "SELECT country_code FROM country WHERE LOWER(country_name) LIKE '%' || $1 || '%';",
      [input.toLowerCase()]
    );

    const data = result.rows[0];
    const countryCode = data.country_code;
    try {
      await db.query(
        "INSERT INTO visited_countries (country_code, user_id) VALUES ($1, $2)",
        [countryCode, currentUserId]
      );
      res.redirect("/");
    } catch (err) {
      console.log(err);
    }
  } catch (err) {
    console.log(err);
  }
});
app.post("/user", async (req, res) => {
  if (req.body.add === "new") {
    res.render("new.ejs");
  } else {
    currentUserId = req.body.user;
    res.redirect("/");
  }
});

app.post("/new", async (req, res) => {
  const name = req.body.name;
  const color = req.body.color;

  const result = await db.query(
    "INSERT INTO users (name, color) VALUES($1, $2) RETURNING *;",
    [name, color]
  );

  let id = result.rows[0].id;
  currentUserId = id;
  res.redirect("/");
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
