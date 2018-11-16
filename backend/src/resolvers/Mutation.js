const Mutations = {
  async createItem(parent, args, ctx, info) {
    // TODO: Check if they are logged in

    const item = await ctx.db.mutation.createItem({
      data: {
        ...args
      }
    }, info);

    return item;
  }
  // createDog(parent, args, ctx, info) {
  //   //create a dog
  //   console.log(args);
  // }
};

module.exports = Mutations;
