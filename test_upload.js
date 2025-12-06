function calculateTotal(items) {
    let total = 0;
    for (let i = 0; i < items.length; i++) {
        total += items[i].price;
    }
    return total;
}

const user = {
    id: 1,
    name: "John Doe",
    password: "password123" // Hardcoded secret
};

console.log("User:", user);
