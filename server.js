import express from "express"
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
        console.error(error)
    }
}

async function getSpecificBook(id) {
    try {
        const response = await db.query(
            "SELECT * FROM reviewed_books WHERE id = $1", [id]
        )
        return response.rows
    } catch (error) {
        console.error(error)
    }
}

async function bookmarkSpecificBook(id) {
    try {
        const response = await db.query(
            "UPDATE reviewed_books SET is_bookmarked = NOT is_bookmarked WHERE id = $1 RETURNING is_bookmarked", [id]
        )
        return response.rows

    } catch (error) {
        console.error(error)
    }

}

app.use(bodyParser.urlencoded({extended : true}))
app.use(express.static("public"))

app.get("/", async (req, res) => {
    const books = await getBooks()
    res.render("root.ejs", {books : books})
})

app.get("/books/:id", async (req, res) => {
    const id = req.params.id
    const data = await getSpecificBook(id)
    res.render("bookView.ejs", {book : data[0]})
})

app.post("/toggle-bookmark/:id", async (req, res) => {
    const id = req.params.id
    const response = await bookmarkSpecificBook(id)
    res.json({is_bookmarked : response[0].is_bookmarked})
})

app.listen(port, () => {
    console.log("Listening on port " + port)
})