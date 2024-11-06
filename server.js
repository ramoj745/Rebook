import express from "express"
import bodyParser from "body-parser"
import pg from "pg"
import methodOverride from "method-override"
import axios from "axios"
import dotenv from "dotenv"

dotenv.config()

const app = express()
const port = process.env.PORT || 3000

const db = new pg.Client({
    user: process.env.SUPABASE_DB_USER,
    password: process.env.SUPABASE_DB_PASSWORD,
    host: process.env.SUPABASE_DB_HOST,
    port: process.env.SUPABASE_DB_PORT,
    database: process.env.SUPABASE_DB_NAME,
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

async function editSpecificBook(id, isbn, description, review, genre, rating) {

    try {
        if (isbn) {
            const response = await axios.get(`https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=data`)
            const bookData = response.data[`ISBN:${isbn}`]
            const title = bookData.title
            const author = bookData.authors[0].name
            const bookLink = bookData.url
            
            await db.query(
                "UPDATE reviewed_books SET isbn = $1, title = $2, author = $3, book_link = $4 WHERE id = $5", [isbn, title, author, bookLink]
            )
        }
        if (description) {
            await db.query(
                "UPDATE reviewed_books SET description = $1 WHERE id = $2",
                [description, id]
            )
        }
        if (review) {
            await db.query(
                "UPDATE reviewed_books SET review = $1 WHERE id = $2",
                [review, id]
            )
        }
        if (genre) {
            await db.query(
                "UPDATE reviewed_books SET genre = $1 WHERE id = $2",
                [genre, id]
            )
        }
        if (rating) {
            await db.query(
                "UPDATE reviewed_books SET rating = $1::integer WHERE id = $2",
                [rating, id]
            )
        }
    } catch (error) {
        console.error(error)
    }
}

async function createBook(isbn, description, genre, review, rating) {

    try {
        const response = await axios.get(`https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=data`)
        const bookData = response.data[`ISBN:${isbn}`]
        
        const title = bookData.title
        const author = bookData.authors[0].name
        const bookLink = bookData.url

        await db.query(
                "INSERT INTO reviewed_books (isbn, title, author, rating, genre, review, description, book_link) VALUES ($1, $2, $3, $4::integer, $5, $6, $7, $8)", 
                [isbn, title, author, rating, genre, review, description, bookLink]
            )

    } catch (error) {
        console.error(error) 
    }
}

async function filterBooks(genre, rating) {

    let query = "SELECT * FROM reviewed_books"
    let params = []

    if (genre) {
        query += " WHERE genre = $1"
        params.push(genre)
    }
    if (rating) {
        query += ` ORDER BY rating ${rating === "lowestToHighest" ? "ASC" : "DESC"}`
    }
    try {
        const response = await db.query(query,params)
        return response.rows
    } catch (error) {
        console.error(error)
    }
}

async function deleteBook(id) {
    try {
        await db.query(
            "DELETE FROM reviewed_books WHERE id = $1", [id]
        )
    } catch (error) {
        console.error(error)
    }
}

async function bookmarkSpecificBook(id) {
    try {
        const response = await db.query(
            "UPDATE reviewed_books SET is_bookmarked = NOT is_bookmarked WHERE id = $1 RETURNING is_bookmarked", 
            [id]
        )
        return response.rows

    } catch (error) {
        console.error(error)
    }
}

app.use(methodOverride("_method"))
app.use(bodyParser.urlencoded({extended : true}))
app.use(express.static("public"))

app.get("/", async (req, res) => {
    const books = await getBooks()
    res.render("root.ejs", {books : books})
})

// specific book view
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

app.patch("/editBook/:id", async (req, res) => {
    const id = req.params.id
    const isbn = req.body.ISBN
    const bookDescription = req.body.description
    const editedReview = req.body.review
    const genre = req.body.genres
    const rating = req.body.ratings

    await editSpecificBook(id, isbn, bookDescription, editedReview, genre, rating)
    res.redirect(`/books/${id}`)
})

// all book view
app.get("/allBooks", async (req, res) => {
    const books = await getBooks()
    res.render("allBooksView.ejs", {books : books})
})

app.post("/createBook", async (req, res) => {
    const isbn = req.body.ISBN
    const description = req.body.description
    const genre = req.body.genres
    const review = req.body.review
    const rating = req.body.ratings

    await createBook(isbn, description, genre, review, rating)
    res.redirect("/allBooks")

})

app.get("/filterBooks", async (req, res) => {
    const {genre, rating} = req.query
    const response = await filterBooks(genre, rating)
    res.json(response)
})

app.delete("/deleteBook/:id", async (req, res) => {
    const id = req.params.id
    await deleteBook(id)
    res.status(200).json({message : "Book deleted successfully."})
})

app.listen(port, () => {
    console.log("Listening on port " + port)
})