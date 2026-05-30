import {  } from '@prisma/client';
import { faker } from '@faker-js/faker';
import Decimal from 'decimal.js';



export function fakeResto() {
  return {
    name: faker.person.fullName(),
    address: undefined,
  };
}
export function fakeRestoComplete() {
  return {
    id: faker.string.uuid(),
    name: faker.person.fullName(),
    address: undefined,
    createdAt: new Date(),
  };
}
export function fakeUser() {
  return {
    name: faker.person.fullName(),
    username: faker.internet.userName(),
    email: undefined,
    emailVerified: undefined,
    image: undefined,
    password: undefined,
  };
}
export function fakeUserComplete() {
  return {
    id: faker.string.uuid(),
    name: faker.person.fullName(),
    username: faker.internet.userName(),
    email: undefined,
    emailVerified: undefined,
    image: undefined,
    password: undefined,
    role: 'UNKNOW',
    restoId: undefined,
  };
}
export function fakeProductStock() {
  return {
    name: faker.person.fullName(),
    imageProduct: undefined,
    price: faker.number.float(),
    stock: faker.number.float(),
    cat: faker.lorem.words(5),
  };
}
export function fakeProductStockComplete() {
  return {
    id: faker.string.uuid(),
    restoId: undefined,
    name: faker.person.fullName(),
    imageProduct: undefined,
    price: faker.number.float(),
    stock: faker.number.float(),
    cat: faker.lorem.words(5),
  };
}
export function fakeProduct() {
  return {
    sellprice: faker.number.float(),
    restoId: undefined,
  };
}
export function fakeProductComplete() {
  return {
    id: faker.string.uuid(),
    productId: faker.string.uuid(),
    sellprice: faker.number.float(),
    restoId: undefined,
  };
}
export function fakeOnSaleProduct() {
  return {
    quantity: faker.number.int(),
  };
}
export function fakeOnSaleProductComplete() {
  return {
    id: faker.string.uuid(),
    productId: faker.string.uuid(),
    quantity: faker.number.int(),
    saledate: new Date(),
    transactionId: faker.string.uuid(),
  };
}
export function fakeTransaction() {
  return {
    totalAmount: undefined,
  };
}
export function fakeTransactionComplete() {
  return {
    id: faker.string.uuid(),
    totalAmount: undefined,
    createdAt: new Date(),
    isComplete: false,
    restoId: undefined,
    revenueType: 'alacarte',
  };
}
export function fakeShopData() {
  return {
    tax: undefined,
    name: undefined,
    address: undefined,
    phone: undefined,
  };
}
export function fakeShopDataComplete() {
  return {
    id: faker.string.uuid(),
    tax: undefined,
    name: undefined,
    address: undefined,
    phone: undefined,
    restoId: undefined,
  };
}
