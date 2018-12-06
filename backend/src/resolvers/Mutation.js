const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { randomBytes } = require('crypto');
const { promisify } = require('util');
const { transport, niceEmail } = require('../mail');
const { hasPermission } = require('../utils');
const stripe = require('../stripe');

const Mutations = {
  async createItem(parent, args, ctx, info) {
    // Check if they are logged in
    if(!ctx.request.userId) {
      throw new Error('You must be logged in to do that!');
    }
    const item = await ctx.db.mutation.createItem({
      data: {
        // create a relationship between item and user
        user: {
          connect: {
            id: ctx.request.userId,
          },
        },
        ...args,
      },
    }, info);

    return item;
  },

  async updateItem(parent, args, ctx, info) {
    // first take a copy of the updates
    const updates = { ...args };
    // remove the ID from the updates
    delete updates.id;
    // run the update method
    return ctx.db.mutation.updateItem({
      data: updates,
      where: {
        id: args.id,
      }
    }, info);
  },

  async deleteItem(parent, args, ctx, info) {
    const where = { id: args.id };
    // 1. find the item
    const item = await ctx.db.query.item({ where }, `{ id title user { id }}`);
    // 2. check if they own the item, or have permissions
    const ownsItem = item.user.id === ctx.request.userId;
    const hasPermissions = ctx.requrest.user.permissions.some(permission => ['ADMIN', 'ITEMDELETE'].includes(permission));
    // doesn't own or have permission
    if(!ownsItem || hasPermissions){
      throw new Error('You do not have permission to do that!');
    }
    // 3. delete it
    return ctx.db.mutation.deleteItem({ where }, info);
  },

  async signup(parent, args, ctx, info) {
    // lowercase email
    args.email = args.email.toLowerCase();
    // hash password
    const password = await bcrypt.hash(args.password, 10);
    // create user in database
    const user = await ctx.db.mutation.createUser({
      data: {
        ...args,
        password,
        permissions: { set: ['USER'] },
      },
    }, info);
    //create jwt
    const token = jwt.sign({ userId: user.id }, process.env.APP_SECRET);
    // set the jwt as a cookie on the response
    ctx.response.cookie('token', token, {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 365, // 1 year cookie
    });
    // return user
    return user;
  },

  async signin(parent, { email, password }, ctx, info) {
    // 1. check if there is a user with email
    const user = await ctx.db.query.user({ where: { email }});
    if(!user) {
      throw new Error(`No such user found for email ${email}`);
    }
    // 2. check if password is correct
    const valid = await bcrypt.compare(password, user.password);
    if(!valid) {
      throw new Error('Invalid Password!');
    }
    // 3. generate jwt token
    const token = jwt.sign({ userId: user.id }, process.env.APP_SECRET);
    // 4. set cookie with token
    ctx.response.cookie('token', token, {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 365, // 1 year cookie
    });
    // 5. return user
    return user;
  },

  signout(parent, args, ctx, info) {
    // clear cookie
    ctx.response.clearCookie('token');
    return { message: 'Goodbye!'};
  },

  async requestReset(parent, args, ctx, info) {
    // 1. Check if this is a real user
    const user = await ctx.db.query.user({ where: { email: args.email }});
    if(!user) {
      throw new Error(`No such user found for email ${args.email}`);
    }
    // 2. Set a reset token and expiry on user
    const randomBytesPromisified = promisify(randomBytes);
    const resetToken = (await randomBytesPromisified(20)).toString('hex');
    const resetTokenExpiry = Date.now() + 3600000; // 1 hour from now
    const res = await ctx.db.mutation.updateUser({
      where: { email: args.email },
      data: { resetToken, resetTokenExpiry },
    });
    // 3. Email reset token
    const mailRes = await transport.sendMail({
      from: 'Amatseshe@gmail.com',
      to: user.email,
      subject: 'Your Password Reset Token',
      html: niceEmail(`Your Password Reset Token is here!
      \n\n
      <a href="${process.env.FRONTEND_URL}/reset?resetToken=${resetToken}">Click Here to Reset</a>`),
    });

    // 4. return message
    return { message: 'Thanks!'};
  },

  async resetPassword(parent, args, ctx, info) {
    // 1. check if passwords match
    if(args.password !== args.confirmPassword) {
      throw new Error('Passwords do not match!');
    }
    // 2. check if its a legit reset token
    // 3. check if its expired
    const [user] = await ctx.db.query.users({
      where: {
        resetToken: args.resetToken,
        resetTokenExpiry_gte: Date.now() - 3600000,
      },
    });
    if(!user){;
      throw new Error('This token is either invalid or expired!');
    }
    // 4. hash new password
    const password = await bcrypt.hash(args.password, 10);
    // 5. save new password to user and remove old resetToken
    const updatedUser = await ctx.db.mutation.updateUser({
      where: { email: user.email },
      data: {
        password,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });
    // 6. generate JWT
    const token = jwt.sign({ userId: updatedUser.id }, process.env.APP_SECRET);
    // 7. set the JWT cookie
    ctx.response.cookie('token', token, {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 365, // 1 year cookie
    });
    // 8. return new user
    return updatedUser;
  },
  async updatePermissions(parent, args, ctx, info) {
    // 1. check if they are logged in
    if(!ctx.request.userId) {
      throw new Error('You must be logged in to do that!');
    }
    // 2. query the current user
    const currentUser = await ctx.db.query.user({
      where: {
        id: ctx.request.userId,
      },
    },info);
    // 3. check if they have permissions to do this
    hasPermission(currentUser, ['ADMIN', 'PERMISSIONUPDATE']);
    // 4. update the permissions
    return ctx.db.mutation.updateUser({
      data: {
        permissions: {
          set: args.permissions,
        },
      },
      where: {
        id: args.userId
      }
    }, info);
  },
  async addToCart(parent, args, ctx, info) {
    // 1. check signed in
    const { userId } = ctx.request;
    if(!userId){
      throw new Error('You must be signed in');
    }
    // 2. query the users current cart
    const [existingCartItem] = await ctx.db.query.cartItems({
      where: {
        user: { id: userId },
        item: { id: args.id },
      }
    });
    // 3. check if item is already in cart and increment by 1 if it is
    if(existingCartItem) {
      console.log('This item is already in their cart');
      return ctx.db.mutation.updateCartItem({
        where: { id: existingCartItem.id },
        data: { quantity: existingCartItem.quantity + 1},
      }, info);
    }
    // 4. if not create fresh cartItem
    return ctx.db.mutation.createCartItem({
      data: {
        user: {
          connect: { id: userId },
        },
        item: {
          connect: { id: args.id },
        },
      }
    }, info);
  },
  async removeFromCart(parent, args, ctx, info) {
    // 1. find cart item
    const cartItem = await ctx.db.query.cartItem({
      where: {
        id: args.id,
      },
    }, `{ id, user { id }}`);
    // 1.5 make sure we found an item
    if(!cartItem) throw new Error('No CartItem found!');
    // 2. make sure they own the cart item
    if(cartItem.user.id !== ctx.request.userId) {
      throw new Error('Nope');
    }
    // 3. delete cart item
    return ctx.db.mutation.deleteCartItem({
      where: { id: args.id },
    }, info);
  },
  async createOrder(parent, args, ctx, info) {
    // 1. query current user and make sure they are signed in
    const { userId } = ctx. request;
    if(!userId) throw new Error('You must be signed in to complete this order.');
    const user = await ctx.db.query.user({where: { id: userId } },
      `{
        id
        name
        email
        cart {
          id
          quantity
          item { title price id description image largeImage }
        }}`
    );
    // 2. recalculate the total for price
    const amount = user.cart.reduce((tally, cartItem) => tally + cartItem.item.price * cartItem.quantity, 0);
    // 3. create the stripe charge
    const charge = await stripe.charges.create({
      amount,
      currency: 'USD',
      source: args.token,
    });
    // 4. convert the cartItems to OrderItems
    const orderItems = user.cart.map(cartItem => {
      const orderItem ={
        ...cartItem.item,
        quantity: cartItem.quantity,
        user: { connect: { id: userId } },
      };
      delete orderItem.id;
      return orderItem;
    });
    // 5. create the order
    const order = await ctx.db.mutation.createOrder({
      data: {
        total: charge.amount,
        charge: charge.id,
        items: { create: orderItems },
        user: { connect: { id: userId } },
      },
    });
    // 6. clean up - clear the users cart, delete cartItems
    const cartItemIds = user.cart.map(cartItem => cartItem.id);
    await ctx.db.mutation.deleteManyCartItems({
      where: {
      id_in: cartItemIds,
      },
    });
    // 7. return the order to the client
    return order;
  },
};

module.exports = Mutations;
