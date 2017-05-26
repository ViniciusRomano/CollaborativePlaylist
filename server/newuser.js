Accounts.onCreateUser(function (options, user) {
    user.profile['likes'] = [];
    user.profile['dislikes'] = [];
    return user;
});