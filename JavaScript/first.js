// const name = "Albert"
// let age = 25
// const is_dev = true

// console.log(name)
// console.log(age)
// console.log(typeof age)
// age = 26
// console.log(age === 26)

// function greet(name) {
//     console.log(`Hello ${name} `);
// }

// greet("Albert");
function print(x){
    console.log(x)
}

// let nums = [1,2,3,4,5,6]  // pop, push, shift, unshift
// print(nums)

// for (const i of nums){
//     print(i)
// }

// const users = [
//     {name: "Albert", age: 25},
//     {name: "John", age: 30},
//     {name: "Anna", age: 22}
// ]

// print(users[0].name)

// users[0].age = 26

// users.push({name: "David", age: 28})

// for (i of users){
//     print(i.name)
// }



// const user = {
//     name: "Albert",
//     age: 25,
//     city: "Yerevan"
// };

// for (const key in user){
//     print(key)
//     console.log(key, user[key])
// }

// const nums = [5, 10, 15, 20];

// for (const i of nums){
//     print(i)
// }

// const products = [
//     {name: "Laptop", price: 1200},
//     {name: "Phone", price: 800},
//     {name: "Mouse", price: 50}
// ];

// print(products.find(products => products.name === "Phone"))

// function thanks(name){
//     console.log(`Thank you ${name}`)
// }

// function processing(name, callback){
//     console.log(`${name} is in processing`)

//     callback(name)
// }

// processing("Albert", thanks)

// processing("Mane", name => {
//     console.log(`We apprisiate you ${name}`)
// })


// const user = {
//     name: "Albert",

//     greet() {
//         console.log("Hello");
//     }
// };

// user.greet()

// const user2 = {
//     name: "Albert",
//     age: 52
// };

// let { name, age = 18 } = user2;

// console.log(age);

// const user = {
//     name: "Albert",
//     age: 25,
//     city: "Yerevan"
// };

// const { name, ...x} = user;

// console.log(name);
// console.log(x);

class BankAccount{
    #balace = 0
    name = "Albert"

    deposite(amount){
        this.#balace += amount
        console.log(this.#balace)
    }

    GetBalance() {
     console.log(this.#balace)     
    }

    test(){
        console.log(`Privet `)
    }
}
BankAccount.prototype.greet = function() {
    console.log(`Hello ${this.name}`);
};
const ba = new BankAccount
ba.deposite(10000)
ba.GetBalance()

console.log(Object.getPrototypeOf(ba));