import { faker } from '@faker-js/faker';

export const superUser = {
  valid: {
    login: 'admin',
    password: 'qwerty',
  },
  notValid: {
    login: 'neAdmin',
    password: 'abracadabra',
  },
};

export const preparedUser = {
  valid1: {
    login: 'User1',
    password: 'password',
    email: 'somemail1@gmail.com',
  },
  valid2: {
    login: 'User2',
    password: 'password',
    email: 'somemail2@gmail.com',
  },
  short: {
    login: faker.random.alpha(2),
    password: faker.random.alpha(5),
    email: 'somemailgmail.com',
  },
  long: {
    login: faker.random.alpha(11),
    password: faker.random.alpha(21),
    email: 'somemail@gmail.c',
  },
  login1: {
    loginOrEmail: 'User1',
    password: 'password',
  },
  login2: {
    loginOrEmail: 'User2',
    password: 'password',
  },
  login1withNewPassword: {
    loginOrEmail: 'User1',
    password: 'newpassword',
  },
};

export const banUserDto = {
  valid: {
    isBanned: true,
    banReason: faker.random.alpha(20),
  },
  validUnBun: {
    isBanned: false,
    banReason: faker.random.alpha(20),
  },
  notValid: {
    isBanned: 'true',
    banReason: faker.random.alpha(19),
  },
};

export const preparedBlog = {
  valid: {
    name: 'valid name',
    description: 'valid description',
    websiteUrl: 'https://it-incubator.io/',
  },
  newValid: {
    name: 'new valid name',
    description: 'new valid description',
    websiteUrl: 'https://it-incubator.io/new',
  },
  short: {
    name: '',
    description: '',
    websiteUrl: '',
  },
  long: {
    name: 'Length-16_RJmZKM',
    description: faker.random.alpha(501),
    websiteUrl: `https://it-incubator.io/new/${faker.random.alpha(73)}`
  },
};

export const preparedPost = {
  valid: {
    title: 'valid title',
    shortDescription: 'valid shortDescription',
    content: 'valid content',
  },
  newValid: {
    title: 'new valid title',
    shortDescription: 'new valid shortDescription',
    content: 'new valid content',
  },
  long: {
    title: faker.random.alpha(31),
    shortDescription: faker.random.alpha(101),
    content: faker.random.alpha(1001),
  },
};

export const preparedSecurity = {
  email: {
    valid: {email: 'somemail@gmail.com'},
    notValid: {email: '222^gmail.com'},
    notExist: {email: 'notexist@mail.com'}
  }
}

export const preparedPassword = {
  valid: 'password',
  short: {password: faker.random.alpha(5)},
  long: {password: faker.random.alpha(21)},
  newPass: 'newpassword'
}

export const prepareLogin = {
  valid: {
    loginOrEmail: 'MyLogin',
    password: 'newpassword'
  },
  notValid: {
    loginOrEmail: 1,
    password: 1
  },
  notExist: {
    loginOrEmail: 'NotExist',
    password: 'qwerty'
  },
}
