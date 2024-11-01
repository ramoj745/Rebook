import express from "express"
import bodyParser from "body-parser"
import pg from "pg"
import methodOverride from "method-override"
import axios from "axios"

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

async function editSpecificBook(id, isbn, description, review) {

    try {
        if (isbn) {
            await db.query(
                "UPDATE reviewed_books SET isbn = $1 WHERE id = $2", [isbn, id]
            )
            const response = await axios.get(`https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=data`)
            const bookData = response.data[`ISBN:${isbn}`]

            console.log(bookData)
            
            const title = bookData.title
            const author = bookData.authors[0].name
            const bookLink = bookData.url

            try {
                await db.query(
                    "UPDATE reviewed_books SET title = $1, author = $2, book_link = $3 WHERE id = $4",
                    [title, author, bookLink, id]
                )
            } catch (error) {
                console.error(error)
            }
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

    } catch (error) {
        console.error(error)
    }
}

async function createBook(isbn, description, genre, review, rating) {

    try {
        const response = await axios.get(`https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=data`)
        const bookData = response.data[`ISBN:${isbn}`]

        console.log(bookData)
        
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
    console.log(data)
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

    await editSpecificBook(id, isbn, bookDescription, editedReview)
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
    const genre = req.body.genre
    const review = req.body.review
    const rating = req.body.options

    await createBook(isbn, description, genre, review, rating)
    res.redirect("/allBooks")

})

app.listen(port, () => {
    console.log("Listening on port " + port)
})