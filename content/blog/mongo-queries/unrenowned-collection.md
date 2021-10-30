---
title: Unrenowned 'collection' of MongoDB stuff - Part 1
description: Just a bunch of interesting and lesser-known MongoDB queries and/or options you should know to make your queries more efficient and effective.
date: "2021-10-28T18:20:37.677Z"
---

Over the past few months of working very closely with MongoDB, I've come to experience some very obscure aspects of Mongo that could help everyone better their queries and make life easier. I'll probably be writing many parts of this since I am sure I will learn something new again and I would want to share that as well.

<sub>All examples are NodeJS examples. Refer to the docs for your driver's examples.</sub>
<br /><br />

**Beware: This post will be lengthy and verbose, I will try to explain each topic as throughly as possible + simplify it. Also, this post will contain a ton of links, do give them a read as well!**

_Note: This post might be a bit advanced for someone who's new to Mongo, but as long as you can write the basic queries well, these topics should make sense!_

---
_Sources used for my personal learning and thereby this post:_
- [MongoDB Docs](https://docs.mongodb.com/), but also the doc for the [NodeJS driver](https://docs.mongodb.com/drivers/node/current/)(since I use Node mainly for development)
- The holy grail for developers: [StackOverflow](https://stackoverflow.com/), individual post/question links will be quoted during the mention.
- Good ol' [Googling](https://google.com) and [GitHub](https://github.com) issues wherever applicable.
---
Here are the contents that this post will cover:
We will start with simpler ones and move one to advanced ones later on.
1. **$setOnInsert** | [Official documentation](https://docs.mongodb.com/manual/reference/operator/update/setOnInsert/)
2. **$facet** | [Official documentation](https://docs.mongodb.com/upcoming/reference/operator/aggregation/facet/)
3. **TTL indexes** | [Official documentation](https://docs.mongodb.com/manual/tutorial/expire-data/#expire-documents-at-a-specific-clock-time)
4. **$lookup pipeline** | [Official documentation](https://docs.mongodb.com/manual/reference/operator/aggregation/lookup/#join-conditions-and-subqueries-on-a-joined-collection)

## $setOnInsert

Let's start of with something simple and easy yet an extremely effective solution to a common use case. If you've ever had an update query with upsert and you would want to add a field only once in the beginning and not change it again?

Here's a somewhat redacted example from my experience at [Stack](https://getstack.in):<br />
&emsp;&emsp;We have scheduled AWS lambdas running which fetch data at regular intervals and updates our database whenever necessary, during this updation, we use `fetchOneAndUpdate` with `{ upsert: true }` as the options which would set all the fields, even if they're already set. Assume you wanted a `createdAt` field for this document, the best and simplest way to do it is using `$setOnInsert`.

Here's an usage example:

```js
db.collection('<collectionName>').updateOne({ userId: ObjectId(userId) },
  { 
    $set: {
      name: 'New User',
      phoneNumber: '+911234567890',
      ...otherDetails,
      updatedAt: new Date()
    },
    $setOnInsert: { createdAt: new Date() }
  }, { upsert: true });
```

So, as you can see, `new Date()` is used for both `updatedAt` and `createdAt`, but the `createdAt` timestamp will be inserted only when upsert happens, i.e. when the documented is inserted for the first time, not when it is being updated.

## $facet

Facets are one of the ways to do multiple operations simultaneously. Think of it like parallel programming for db queries.

> Processes multiple aggregation pipelines within a single stage on the same set of input documents. Each sub-pipeline has its own field in the output document where its results are stored as an array of documents.
>
> The $facet stage allows you to create multi-faceted aggregations which characterize data across multiple dimensions, or facets, within a single aggregation stage. Multi-faceted aggregations provide multiple filters and categorizations to guide data browsing and analysis. Retailers commonly use faceting to narrow search results by creating filters on product price, manufacturer, size, etc.
>
> Input documents are passed to the $facet stage only once. $facet enables various aggregations on the same set of input documents, without needing to retrieve the input documents multiple times.
>
> \- [MongoDB Docs](https://docs.mongodb.com/upcoming/reference/operator/aggregation/facet/)

The reason I quote documentation so much in my posts is because reading documentation gives you an amazing insight of what the thing, in this case, the operator, does and also possible applications, examples are all usually provided in good documentations(like Mongo's Docs).

So, here's another redacted example from our codebase at [Stack](https://getstack.in):<br />
&emsp;&emsp;We have queries where we have to paginate a large enough collection for the user based on a filter while also providing the total number of documents which could match that query. To do this, we use the `$facet` aggregation stage.

Usage example:

```js
const userPosts = await db.posts.aggregate([
  {
    $facet: {
      // This fetches a specific page of posts.
      posts: [
        { $match: { userId: ObjectId(userId) } }
        { $limit: limit },
        { $skip: (page - 1) * limit }
      ],
      totalPosts: [
        // This fetches the count of all the documents for this user.
        { $match: { userId: ObjectId(userId) } },
        {
          $group: {
            _id: 0,
            count: { $sum: 1 }
          }
        }
      ]
    }
  }
]).toArray().then(([data]) => data); // This returns an object with keys from your facet.
```

There's one catch though, as the docs mention, the `$facet` returns the pipeline values in an array, so to access the total count of posts for this user, you would have to do:

```js
const totalPosts = userPosts?.totalPosts?.count || 0; // Using optional chaining is excellent to handle default values.
const paginatedPosts = userPosts?.posts || [];
```

Reference to [optional chaining](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Optional_chaining).

## TTL Indexes

There are 2 ways of setting TTL Indexes in MongoDB:
1. [Expire after a specified number of seconds](https://docs.mongodb.com/manual/tutorial/expire-data/#expire-documents-after-a-specified-number-of-seconds)
2. [Expire at a given clock time](https://docs.mongodb.com/manual/tutorial/expire-data/#expire-documents-at-a-specific-clock-time)

There are extremely useful applications for both approaches.<br />
Examples for each are:
- Specified seconds - OTPs/2FAs - Expiring temporary passwords after a specified time(like 60/120 seconds).
- Specified clock time - Token expiry - Expiring relatively longer duration tokens at a specified clock time(every day at 6AM)

To set this up, you'd have to create an index on your db, I prefer the shell method, so I basically copy pasted the command from the official docs onto my terminal.

Here's the command I used for the following code:
```js
db.thirdPartyTokens.createIndex( { "expireAt": 1 }, { expireAfterSeconds: 0 } )
```

```js
// Enjoy a freebie. Here's a function that you can use to get a specific time for a given day.
const getNextDayFiveAM = () => {
  const day = new Date().setDate(new Date().getDate() + 1);
  const fiveAM = new Date(day).setHours(5, 0, 0, 0);
  return new Date(fiveAM);
};
await db.thirdPartyTokens.updateOne({ userId: ObjectId(userId) },
  {
    $set: {
      thirdPartyAPIToken: token,
      expireAt: getNextDayFiveAM()
    }
  });
```

## $lookup pipeline

For the final one, it's going to be just a bit complicated.

The concept is simple, when you do a lookup from one collection to the other, you can perform an aggregation pipeline on the other collection's documents, just like you can on the main query. It becomes very helpful sometimes.

I will not be sharing any sample code for this as the usage for this becomes very complicated and case specific. But I'd highly recommend looking into the pipline variation to `$lookup`. It lets you use all the stages of an aggregation pipeline right inside of the lookup so your main query can be neat and more readable.

---

Now that you've (hopefully) learnt about some exciting, obscure features in Mongo, time to put that 
🧠 to use and write better, well optimized and more readable queries! 🖥️ <br />
<img src="../../assets/big-brain.gif" alt="Congratulations" width="600"/><br />

In the next part, we will probably have more of these features to look into! However, I will be making another part to this as and when I learn more about MongoDB and also have enough to share, so I am not sure when that would be.

I will be linking the next part once I've published it! :)

Hope this was informative!

See you in the next one,<br />
\- Paradox ❤️
