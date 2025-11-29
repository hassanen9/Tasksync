

const books = [{id: 1, title: "test", author: "test", year: 2020}];


const [id, title, ...rest] = books;

console.log(id, title, rest);

//destructuring
const person = {name: "Alice", age: 25, city: "New York"};
const {name: personName, age: personAge} = person;
console.log(personName, personAge);

//Template literals
const name = "John";
const age = 30;
const message = `My name is ${name} and I am ${age} years old.`;
console.log(message);

//Arrow functions
const add = (a, b) => a + b;
console.log(add(2, 3));

//ternary operator
const isAdult = age >= 18 ? "Yes" : "No";
console.log(isAdult);

//optional chaining
const user1 = {profile: {name: "Bob"}};
const user2 = {address: {city: "Los Angeles"}};
console.log(user1?.profile?.name);
console.log(user2?.address?.name); // undefined instead of error


//map array method
const numbers = [1, 2, 3, 4, 5];
const doubled = numbers.map(num => num * 2);
console.log(doubled);

//filter array method
const evenNumbers = numbers.filter(num => num % 2 === 0);
console.log(evenNumbers);