import express from "express"
import axios from "axios"
import bodyParser from "body-parser"
import pg from "pg"

const app = express()
const port = 3000

const db = new pg.Client({
    user: "postgres",
    password: "75369854123",
    host: "localhost",
    port: 5432,
    database: "books",
})

db.connect()

async function getBooks() {
    try {
        const response = await db.query(
            "SELECT * FROM reviewed_books ORDER BY id ASC"
        )
        return response.rows
    } catch (error) {
        console.log(error)
    }
}

app.use(bodyParser.urlencoded({extended : true}))
app.use(express.static("public"))

app.get("/", async (req, res) => {
    const books = await getBooks()
    res.render("root.ejs", {books : books})
})

app.get("/books/:id", (req, res) => {

}) 

app.listen(port, () => {
    console.log("Listening on port " + port)
})