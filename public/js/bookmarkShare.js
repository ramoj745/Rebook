const bookmark = document.querySelector(".bookmark")

const share = document.getElementById("share")
const title = document.querySelector(".book-title")
const author = document.querySelector(".book-author")

bookmark.addEventListener("click", async () => {
    const bookId = bookmark.getAttribute("data-id")

    try {
        const response = await axios.post(`/toggle-bookmark/${bookId}`)
        const currentState = response.data.is_bookmarked

        if (currentState) {
            const bookmarkIcon = document.querySelector(".bookmark")
            bookmarkIcon.src = "/images/is_bookmarked-cropped.svg"
            bookmark.classList.add("bookmarkTrue")

            setTimeout(() => {
                bookmark.classList.remove("bookmarkTrue");
            }, 300);

        } else {
            const bookmarkIcon = document.querySelector(".bookmark")
            bookmarkIcon.src = "/images/bookmark-cropped.svg"
        }

    } catch (error) {
        console.error(error)
    }
})

const shareData = {
    title: title.textContent,
    text: author.textContent,
    url: window.location.href
}

share.addEventListener("click", async () => {
    if (navigator.share) {
        try {
            await navigator.share(shareData)
            console.log("Content shared.")
        } catch (error) {
            console.error("Error sharing content: ", error)
        }
    } else {
        justCopyAndPasteTheLink()
    }
})

async function justCopyAndPasteTheLink() {
    try {
        await navigator.clipboard.writeText(shareData.url)
        alert("Link Copied to clipboard. Share the book with your friends!")
    } catch (error) {
        console.log("Error copying link")
    }
}
