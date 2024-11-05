const bookmark = document.querySelector(".bookmark")

bookmark.addEventListener("click", async () => {
    const bookId = bookmark.getAttribute("data-id")

    try {
        const response = await axios.post(`/toggle-bookmark/${bookId}`)
        const currentState = response.data.is_bookmarked

        if (currentState) {
            const bookmarkIcon = document.querySelector(".bookmark")
            bookmarkIcon.src = "/images/is_bookmarked.svg"
            bookmark.classList.add("bookmarkTrue")

            setTimeout(() => {
                bookmark.classList.remove("bookmarkTrue");
            }, 300);

        } else {
            const bookmarkIcon = document.querySelector(".bookmark")
            bookmarkIcon.src = "/images/bookmark.svg"
        }

    } catch (error) {
        console.error(error)
    }
})