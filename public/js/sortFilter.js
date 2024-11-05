document.getElementById("genreNonModal").addEventListener("change", updateBook)
document.getElementById("ratingNonModal").addEventListener("change", updateBook)

async function updateBook() {
    const genre = document.getElementById("genreNonModal").value
    const rating = document.getElementById("ratingNonModal").value

    try {
        const response = await axios.get("/filterBooks", {
            params: {genre, rating}
        })
    
        const books = response.data

        if (books.length === 0) {
            document.querySelector(".all-books-shelf").textContent = "No books found matching your criteria."
        } else {
            renderPage(books)
        }

    } catch (error) {
        console.error(error)
    }
}

function renderPage(books) {
    const bookList = document.querySelector(".all-books-shelf")
    bookList.innerHTML = ""
    books.forEach(book => {
        const bookCard = document.createElement('div')

        bookCard.classList.add("all-book")
        bookCard.innerHTML = `
         <a href="/books/${book.id}">
        <img src="https://covers.openlibrary.org/b/isbn/${book.isbn}-M.jpg" class="all-book-img">
        </a>
        <h1 style="font-size: 1.7rem;">${book.title}</h1>
        `;
        bookList.appendChild(bookCard)
    })
}


