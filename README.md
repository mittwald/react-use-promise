# React Use Promise

Simple and declarative use of Promises in your React components. Observe their
state and refresh them in various advanced ways.

```jsx
import { Suspense } from "react";
import { usePromise, refresh } from "@mittwald/react-use-promise";

// Async loader 👇 function
const loadNewsItem = async (id) => {
  const res = await fetch(
    `https://hacker-news.firebaseio.com/v0/item/${id}.json`,
  );
  return res.json();
};

const NewsItem = ({ id }) => {
  const news = usePromise(loadNewsItem, [id], {
    // ✨ Use the async loader 👆 function with its ID-parameter
    tags: [`news/${id}`],
    // Use tags 🏷️ with support for "tree structures" 🌳
  });

  // Do not care about any loading states – just use the result 🤩
  return (
    <li>
      {news.by}: {news.title}
    </li>
  );
};

const App = () => {
  const reloadAllNews = () => {
    // ✨ Reload Promises 🔄 by using tags and glob pattern *️⃣
    refresh({ tag: "news/*" });
  };

  return (
    // The Suspense component will render a fallback️
    // if any child component is in loading state ⏱️
    <Suspense fallback={<div>Loading...</div>}>
      <NewsList>
        <NewsItem id={1000} />
        <NewsItem id={1001} />
        <NewsItem id={1002} />
      </NewsList>
      <button onClick={reloadAllNews}>Reload news</button>
    </Suspense>
  );
};
```

## Features

- Simple and declarative use of Promises, [loading-](#defining-loading-views)
  and [error views](#error-handling)
- [Auto-refresh](#autorefresh) after timeout
- Type-Safe API
- No "double-loading" when using "same" Promise in different places in your app
- Caching with support for [custom tags](#tags-1)
- [Opt-out Suspense-based loading](#opt-out-suspense)
- [Cache invalidation](#refreshing-resources) with
  [glob support](#hierarchical-tags)
- [Observable loading state](#watchstate)
- Set up [lazy-loading](#-lazy-loading-with-async-resources) "async resources"
  with the alternative [`getAsyncResource`-API](#getasyncresource) and pass them
  as prop to child components
- ["Resourceify"](#resourceify) any async function
- Fully tested and well-structured TypeScript code-base

## Table of Contents

- [Installing](#installing)
- [Terminology](#terminology)
- [API](#api)
  - [usePromise](#usepromise)
  - [getAsyncResource](#getasyncresource)
  - [Async resource](#async-resource-1)
  - [Options](#options)
  - [refresh](#refresh-1)
- [Caching](#caching)
  - [Challenges concerning Caching](#challenges-concerning-caching)
  - [Resource store](#resource-store)
  - [Creating unique storage keys](#creating-unique-storage-keys)
  - [Using explicit loader IDs](#using-explicit-loader-ids)
- [Tags](#tags-1)
  - [Hierarchical Tags](#hierarchical-tags)
- [Refreshing resources](#refreshing-resources)
- [Lazy loading with Async Resources](#-lazy-loading-with-async-resources)
- [Defining loading views](#defining-loading-views)
- [Opt-Out Suspense](#opt-out-suspense)
- [Opt-Out Loading](#opt-out-loading)
- [Error handling](#error-handling)
- [Best practices](#best-practices)
- [Migration guides](#migration-guides)

## Installing

With npm:

```shell
$ npm install @mittwald/react-use-promise
```

With Yarn:

```shell
$ yarn add @mittwald/react-use-promise
```

## Terminology

### (Async) resource

An async resource (or just resource) represents something that has to be loaded
asynchronously. Asynchronous loading involves different states, like "loading"
or "loading is done", that should be reflected in the UI. Basically async
resources encapsulating Promises and equipping them with relevant features like
observing the Promises state or caching the result.

### Async loader (function)

The async loader function is simply a function returning a Promise and thus acts
as the basic input for async resources.

## API

### usePromise

Get the result of a Promise by passing an async loader with the relevant loader
parameters and an optional configuration to the `usePromise` hook.

#### usePromise(asyncLoader, loaderParameters, options?)

Returns: the value of the async resource

For possible options see [Options section](#options).

```javascript
import { usePromise } from "@mittwald/react-use-promise";

// 1. Inline loader function
const response = usePromise(() => axios("/user/12345"), []);

// 2. Loader function with parameters
const getUser = (id) => axios(`/user/${id}`);
const response = usePromise(getUser, [12345]); // 👈 loader parameters as array

// 3. With options
const response = usePromise(getUser, [12345], {
  autoRefresh: {
    seconds: 30,
  },
});
```

### getAsyncResource

This is an alternative and more advanced API to the `usePromise` hook. For
details see
[Lazy Loading with Async Resources](#-lazy-loading-with-async-resources). The
`usePromise` hook uses the [`getAsyncResource`-API](#getasyncresource) under the
hood and is basically just a shortcut for
`getAsyncResource(asyncLoader, loaderParameters, options).use()`.

Get an async resource by passing an async loader with the relevant loader
parameters and an optional configuration to the `getAsyncResource` function.

#### getAsyncResource(asyncLoader, loaderParameters, options?)

Returns: [Async resource](#async-resource-1)

For possible options see [Options section](#options).

```javascript
import { getAsyncResource } from "@mittwald/react-use-promise";

// 1. Inline loader function
const userResource = getAsyncResource(() => axios(`/user/123`), []);

// 2. Loader function with parameters
const getUser = (id) => axios(`/user/${id}`);
const userResource = getAsyncResource(getUser, [123]);

// 3. With options
const userResource = getAsyncResource(getUser, [123], {
  tags: ["api"],
});

// 4. Usage in factory function
const getUserResource = (id) => getAsyncResource(getUser, [id]);
```

### Async resource

The async resource returned by `getAsyncResource` has the following API.

#### .use()

Returns: the value of the async resource, or the result object when
`useSuspense: false` (see [Opt-out Suspense](#opt-out-suspense))

Calling the `use` method will actually start the loading process and returns the
value of the async resource, once it is loaded. Everytime the resource is
refreshed, the used value automatically updates itself.

```jsx
import getUserResource from "../resources/user";

const Username = ({ id }) => {
  const user = getUserResource(id).use(); // 👈 using the resource value
  return <>{user.name}</>;
};
```

#### .refresh()

Calling the `refresh` method will clear the cached resource value and trigger a
reload, if the resource is being used in any mounted component.

```jsx
import getScoreResource from "../resources/score";

const Score = ({ matchId }) => {
  const scoreResource = getScoreResource(matchId);
  const score = scoreResource.use();
  const reloadScore = () => scoreResource.refresh(); // 👈 refresh the resource

  return (
    <ScoreBox>
      <Score>
        {score.home} - {score.guest}
      </Score>
      <button onClick={reloadScore}>Reload</button>
    </ScoreBox>
  );
};
```

#### .watchState()

Returns: `"void" | "loading" | "loaded" | "error"`

You can watch the resources state by calling the `watchState` method.

```jsx
import getScoreResource from "../resources/score";

const Score = ({ matchId }) => {
  const scoreResource = getScoreResource(matchId);
  const scoreResourceState = scoreResource.watchState();
  const score = scoreResource.use();
  const scoreIsLoading = scoreResourceState === "loading";

  return (
    <ScoreBox>
      <Score>
        {score.home} - {score.guest}
      </Score>
      <LoadingSpinner visible={scoreIsLoading} />
    </ScoreBox>
  );
};
```

### Options

You can configure `usePromise` and `getAsyncResource` with the following
options:

#### autoRefresh (only supported by `usePromise`)

Type:
[Duration like object](https://moment.github.io/luxon/api-docs/index.html#durationfromobject)\
Default: `undefined`

When a duration is configured, the resource will automatically be refreshed in
the provided interval. If the same resource has multiple auto-refresh intervals,
the shortest interval will be used.

```javascript
autoRefresh: {
  seconds: 30;
}
```

#### refreshOnWindowFocus (only supported by `usePromise`)

Type: `boolean`\
Default: `false`

Set this option to `true`, if the resource should automatically be refreshed, if
the window is re-focused.

#### keepValueWhileLoading (only supported by `usePromise`)

Type: `boolean`\
Default: `true`

If `true`, the previously loaded value will be returned during refresh is in
progress. The loading view will only be triggered during initial load.

If `false`, the loading view will always be triggered – during initial load and
refresh as well.

#### tags

Type: `string[]`\
Default: `undefined`

With this option you can assign tags to resources. Tags allow you to be
expressive and flexible when accessing resources, e.g. when you need to refresh
multiple resources at once.

You can find details about how to use tags in the [Tags section](#tags-1).

```javascript
tags: ["hackernews", "getRequest"];
```

#### loaderId

Type: `string`\
Default: `"null"`

**It is very unlikely** that you ever need to use this option, but to get around
the "same code" issue (see
["Caveats of default storage key generation"](#caveats-of-default-storage-key-generation)),
you can set an explicit loader ID, that identifies the loader function.

#### useSuspense (only supported by `usePromise`)

Type: `boolean`\
Default: `true`

Set this to `false` to opt-out Suspense-based loading behavior. See
[Opt-Out Suspense](#opt-out-suspense) for more details.

### refresh

If you do not have direct access to the resource that should be refreshed, you
can use the global refresh method.

#### refresh()

Refreshes all resources.

```jsx
import { refresh } from "@mittwald/react-use-promise";

export const Menu = () => (
  <Menu>
    <MenuItem url="/dashboard" />
    <MenuItem url="/projects" />
    <MenuItem url="/profile" />
    <MenuButton onClick={() => refresh()}>Refresh all data</MenuButton>
  </Menu>
);
```

#### refresh(options)

The refresh method takes an option object to do a more selective refresh.

The following options are supported:

- `tag` (`string`): Refreshes all resources matching the given tag. Glob pattern
  are supported here. See also the
  [Hierarchical Tags section](#hierarchical-tags).
- `error` (`true | error`): Set this option to `true`, to refresh all resource
  with errors. Set this option to an error instance, to refresh all resources
  with a matching error. See the [Error handling](#error-handling) section for
  more details.

### resourceify

`resourceify` creates a factory function for async resources based on given
async loader functions.

#### resourceify(asyncLoader)

Example of how to create factory functions for your async loaders:

```js
import { resourceify } from "@mittwald/react-use-promise";

const getUser = (id) => axios(`/user/${id}`);
// Creates a function to get user resources
const getUserResource = resourceify(getUser);
// `myUser` is an async resource
const myUser = getUserResource(["me"], { refresh: { seconds: 30 } });
myUser.use();

// Factory method for HTTP GET-Requests via Axios
import axios from "axios";
export const getHttpResource = resourceify(axios.get);
```

## Caching

Caching the result of async loader functions is essential to make this library
work. Without it, components will end-up in an endless render-loop, since the
re-render after finished loading will trigger the loader function again.

To break this loop, the result (and even the error) of the loader function is
cached inside the resource instance. If a cached result exists, the loader must
not be called again and the cached value is used instead.

### Challenges concerning Caching

This caching approach comes with two essential issues one has to care about:

- creating unique cache keys to store results
- providing flexible ways of cache invalidation

### Resource store

Every time when `usePromise` resp. `getAsyncResource` is called, either a new
resource is created or an existing resource is taken from the resource store. If
a resources has loaded once, it exists in the store and contains the cached
result of the async loader function.

It is noticeable that not the raw result is cached in some "result cache" – **it
is the resource the keeps the cached result which itself is stored in the
resource store**.

### Creating unique storage keys

Basically you do not have to care about storage keys at all, but there are some
odd situations where the default storage key generation fails, and produces
conflicting keys. If so, you probably might not get the expected resource. When
you are experiencing such issues, you better take a look at this section.

#### Same resource, same storage key

When creating storage keys, the same key should be formed for async resources
considered as "same". An async resource is "the same" compared to another
resource, if:

- the loader function is the same
- the parameters used to load the resource are the same

Examples:

```javascript
const getUser = (id) => axios(`/user/${id}`);
const getPost = (id) => axios(`/post/${id}`);

// Same storage key 🍎🍎
const response1 = usePromise(getUser, [12345]);
const response2 = usePromise(getUser, [12345]);

// Same storage key 🍐🍐
const response3 = usePromise(() => getUser(12345), []);
const response4 = usePromise(() => getUser(12345), []);

// Different storage keys 🍎🍋
const response5 = usePromise(getUser, [12345]);
const response6 = usePromise(getUser, [56789]);

// Different storage keys 🍎🍉
const response7 = usePromise(getUser, [12345]);
const response8 = usePromise(getPost, [12345]);

// Different storage keys 🍎🌶️
const response9 = usePromise(() => getUser(12345), []);
const response10 = usePromise(() => getUser(12344 + 1), []);
```

#### Caveats of default storage key generation

In some odd situations the default storage key generation fails and may generate
conflicting keys. To evaluate these situations, you should know some details
about the default behaviour, which is basically implemented like this:

```javascript
import { hash } from "object-code";

const storageKeyObject = {
  loaderFunction,
  parameters,
};

const storageKey = hash(storageKeyObject);
```

As you can see, the implementation heavily relies on the
[`object-code`](https://www.npmjs.com/package/object-code#getting-started)
library, which

> is a blazing fast hash code generator that supports every possible javascript
> value.

When it comes to "hashing" a function (in this case the async loader function),
`object-code` uses `toString()` to get the function _code_ and uses it for
further hashing. This is the point where problems may arise. When two function
using the same code, they must not necessarily behave the same. Think of
functions using variables from their parent scope (🤯).

The following example may result in inconsistencies. (But only if users and
posts share same the IDs.)

```jsx
// File Username.jsx
import repo from "./user";

const loadUserById = (id) => repo.loadById(id);
// same code 👆, but different repo 😧

export const Username = ({ id }) => {
  const user = usePromise(loadUserById, [id]);
  //👆 may be a cached post
  return <>{user.name}</>;
};

// File PostTitle.jsx
import repo from "./post";

const loadPostById = (id) => repo.loadById(id);
// same code 👆, but different repo 😧

export const PostTitle = ({ id }) => {
  const post = usePromise(loadPostById, [id]);
  //👆 may be a cached user
  return <>{post.title}</>;
};
```

### Using explicit loader IDs

**It is very unlikely** that you ever need to use this option, but to get around
the "same code" issue demonstrated above, you can set explicit loader IDs in the
options object.

This example shows how to set explicit loader IDs:

```javascript
// ...
const post = usePromise(loadPostById, [id], {
  loaderId: "loadPostById", // explicit loader ID 😮‍💨
});
// ...
```

## Tags

You can assign tags to resources. A tag is simply a string that classifies the
resource. In advanced scenarios you might want to assign multiple tags to one
resource, expressing the resource matches different classifications.

Using relevant tags creates the possibility to be very expressive and flexible
when it comes to accessing multiple resources at once, e.g. when you need to
refresh them.

For example, you might use tags to refresh some specific resources, when a
backend event occurs.

```jsx
// File components/Chat.jsx
import { usePromise } from "@mittwald/react-use-promise";

const Chat = ({ chatId }) => {
  const messages = usePromise(loadChatMessages, [chatId], {
    tags: [`chat/${chatId}`],
  });

  return (
    <div>
      {messages.map((msg) => (
        <ChatMessage message={msg} key={msg.id} />
      ))}
    </div>
  );
};

// File setup.js
import { refresh } from "@mittwald/react-use-promise";

backendEventListener.on("chatUpdated", (chatId) => {
  refresh({
    tag: `chat/${chatId}`,
  });
});
```

### Hierarchical Tags

Tags are supporting a tree structure, compared to paths in filesystems or URLs
(e.g. `chat/12345/messages`). This creates the possibility to structure your
resources into hierarchical classes. Combined with
[glob support](https://www.npmjs.com/package/minimatch) in cache invalidation,
you can invalidate resources matching a certain level in the tree.

```js
import { refresh } from "@mittwald/react-use-promise";

refresh({
  tag: `chat/12345/**/*`,
});
// Matches everything for the chat 12345
// - chat/12345/messages/1
// - chat/12345/messages/2
// - chat/12345/metaData

refresh({
  tag: `chat/12345/messages/*`,
});
// Matches all messages for the chat 12345
// - chat/12345/messages/1
// - chat/12345/messages/2
```

## Refreshing resources

If a resource has a cached result, the async loader function must not be called
again and the cached value is used instead. To invalidate the cached value you
can call the [`refresh()`](#refresh) method on the resource or use the global
[`refresh()`](#refresh-1) method. As a result the async loader function will
automatically be called again and a component update is triggered when the
result is available.

Refreshing resources that are not used in any mounted component, will suspend
the reload until the resource is actually used the next time.

```js
import { refresh } from "@mittwald/react-use-promise";
```

## 😴 Lazy loading with Async Resources

When constructing your React app, you might get to the point, where you must
decide whether to

- load something from your API and pass the result into some child component,
- or the child component should load the data itself by some ID from its props.

Since loading async resources involves different loading states, it is a good
advice, to react on these state changes, as deep as possible in the component
tree, to avoid needless re-renderings of parent components.

### 💅 Presentational vs. 📦 Container Components

The components deep in the tree are usually some small components, like the
`<Avatar />` component showing an avatar image. These kind of components do have
a clear focus on the visual representation and should not be polluted by some
loading state handling. They are often referred to as _Presentational
Components_. They can be developed as "standalone" and showcased in Storybooks,
without the need of any API.

When the time has come to bring your Presentational Components to life, you can
"wrap" the component in a container that "connects" it with real data. This is
the job of _Container Components_. They care about loading data and compose
Presentational Components to display the data.

Example Presentational Component:

```tsx
// Props needed for presentation
interface Props {
  imageUrl?: string;
  size?: number;
}

const Avatar: FC<Props> = ({ imageUrl, size }) => {
  return <Image round url={imageUrl} size={size} />;
};
```

Example Container Component:

```tsx
interface Props {
  // ID is needed to load the user
  userId: string;
  // optional presentational props are possible
  size?: number;
}

const UserAvatar: FC<Props> = ({ userId, size }) => {
  const profile = usePromise(api.loadUserProfile, [userId]);
  return <Avatar imageUrl={profile.avatarUrl} size={size} />;
};
```

### Async Resources as prop

As an alternative to the user ID, you might pass an Async User Resource as prop
to your Container Component. This makes the component more flexible, because it
is not tied to the actual loading method.

For instance if user profiles can be loaded via multiple API methods, the
`<UserAvatar />` component can still be used without any changes.

It is noticeable that creating Async Resources in any parent component does
**not trigger the loading process**. Therefore, the `.use()` method can be used
in the child components, where the data is actually needed.

Alternative Container Component with lazy loading:

```tsx
// ...
import { AsyncResource, getAsyncResource } from "@mittwald/react-use-promise";

interface Props {
  // Async User Resource passed as prop
  user: AsyncResource<UserData>;
  size?: number;
}

const UserAvatar: FC<Props> = ({ user, size }) => {
  // .use() 🔔 triggers loading when needed
  const profile = user.use();
  return <Avatar imageUrl={profile.avatarUrl} size={size} />;
};

const UserProfileMenu: FC = () => {
  // 😴 Creating the Async Resource does not trigger loading
  const myProfile = getAsyncResource(api.loadMyUserProfile, []);

  return (
    <Menu>
      <MenuHeader>
        <UserAvatar user={myProfile} size={128} />
      </MenuHeader>
      {/* menu items*/}
    </Menu>
  );
};
```

## Defining loading views

When using `@mittwald/react-use-promise` (or other Suspense-based approaches)
you have to define a loading boundary (Reacts `<Suspense />` component) to
display the loading view. Loading boundaries are quite similar to error
boundaries. They "catch" active loading processes in any child component and
render a fallback instead. The benefits of this pattern are:

- No pollution of handling loading states over and over again in your components
- Definition of loading views, where you need them in the component tree
- Flexible level of loading views: Sometimes it is less distracting to use a
  single loading view for a larger section of your app, but sometimes small
  pieces of async data should not keep off parts of your app from rendering.
- Declarative and easy to understand

Example of how to define loading views:

```jsx
const App = () => (
  <Suspense fallback={<FullScreenLoadingSpinner />}>
    {/* ... */}
    <MainLayout>
      <Suspense fallback={<MainMenuLoadingSkeleton />}>
        <MainMenu />
      </Suspense>
      <Suspense fallback={<MainContentLoadingSkeleton />}>
        <MainContent />
      </Suspense>
    </MainLayout>
    {/* ... */}
  </Suspense>
);
```

### Gotchas when defining "built-in" loading views

When you are using `.use()` or `usePromise()` in your component, it can not
define its own loading boundary – at least not for directly used Async
Resources.

In this example the fallback component will not be shown:

```jsx
const UserAvatar = ({ userResource, size }) => {
  const user = userResource.use();
  // 👆 any code below this line will not be executed 🙅 until the async loader is done.
  const loadingView = <AvatarSkeleton size={size} />;
  return (
    <Suspense fallback={loadingView}>
      {/* This fallback 👆 is not rendered for the used resource from above. 😢 */}
      <Avatar imageUrl={user.avatarUrl} size={size} />
    </Suspense>
  );
};
```

The following approaches can help you to solve this issue:

- Split up your component into two separate components – one private with the
  regular rendering, and another one wrapping it with a loading boundary while
  forwarding props to it.

```jsx
const Component = ({ userResource, size }) => {
  const user = userResource.use();
  return <Avatar imageUrl={user.avatarUrl} size={size} />;
};

export const UserAvatar = (props) => {
  const loadingView = <AvatarSkeleton size={props.size} />;

  return (
    <Suspense fallback={loadingView}>
      <Component {...props} />
    </Suspense>
  );
};
```

- Opt-out Suspense-based loading behavior.

```jsx
const UserAvatar = ({ userResource, size }) => {
  const user = userResource.use({ useSuspense: false });

  // `user` is an object with `isSet` and `value` properties
  if (!user.isSet) {
    return <AvatarSkeleton size={size} />;
  }

  // `value` only exists when `isSet === true`
  return <Avatar imageUrl={user.value.avatarUrl} size={size} />;
};
```

- Use a Higher Order Component (HOC) that enhances your regular implementation
  with a loading boundary. This HOC could optionally add an error boundary.

```jsx
const UserAvatar = withLoadingBoundary(({ userResource, size }) => {
  const user = userResource.use();
  return <Avatar imageUrl={user.avatarUrl} size={size} />;
}, AvatarSkeleton);
```

- Use a render component where you access the resource:

```jsx
const UserAvatar = ({ userResource, size }) => {
  const loadingView = <AvatarSkeleton size={size} />;
  return (
    <Suspense fallback={loadingView}>
      <Render>
        {() => {
          const user = userResource.use();
          return <Avatar imageUrl={user.avatarUrl} size={size} />;
        }}
      </Render>
    </Suspense>
  );
};
```

## Opt-Out Suspense

When you want to react explicitly on the loading-state, the suspense-based
loading behavior is a little bit obstructive, e.g. when you want to define
components with
[built-in loading views](#gotchas-when-defining-built-in-loading-views).

You can opt-out Suspense by setting the `useSuspense` option to `false`. When
Suspense is disabled, calling `.use()` resp. `usePromise()` will not trigger any
`<Suspense />` component. Instead, a result object is returned, containing
loading information and the eventual value.

Example of how the opt-out behaves:

```tsx
const message = usePromise(loadMessage, ["12345"], { useSuspense: false });

if (!message.hasValue) {
  return <LoadingView />;
}

return (
  <MessageView message={message.value} activitySpinner={message.isLoading} />
);
```

### Return object with disabled Suspense

The object returned by `.use()` resp. `usePromise()` has the following
properties, when Suspense is disabled.

- `isLoading`: Is `true` when the resource is loading or reloading. `false`
  otherwise.
- `hasValue`: Is `true` when a resource value is available, including the "old"
  value when reloading. `false` otherwise.
- `value`: Contains the resource value. Is only available if `hasValue` is
  `true`.
- `maybeValue`: Contains the resource value, when the resource has loaded.
  `undefined` otherwise.

Examples of result objects:

```js
// Loading the first time or reloading with keepValueWhileLoading disabled
({
  isLoading: true,
  maybeValue: undefined,
  hasValue: false,
});

// When value has loaded
({
  isLoading: false,
  maybeValue: "Foo",
  value: "Foo",
  hasValue: true,
});

// When value is reloading
({
  isLoading: true,
  maybeValue: "Foo",
  value: "Foo",
  hasValue: true,
});
```

## Opt-Out Loading

You probably know that you should
[not call hooks conditionally](https://react.dev/warnings/invalid-hook-call-warning#breaking-rules-of-hooks).
But what if the loader parameters you want to use e.g. in `usePromise` are
optional properties, and the loader function requires them? In this case just
use `null` as parameters and loading is disabled!

😈 Bad:

```jsx
const Username = ({ id }) => {
  if (!id) {
    return null;
  }
  // 💥 This will throw a React error because `usePromise` is called conditionally!
  const user = usePromise(loadUseProfile, [id]);
  return <>{user.name}</>;
};
```

😇 Good:

```jsx
const Username = ({ id }) => {
  // When required loader parameters can be undefined: use null 👇
  const user = usePromise(loadUseProfile, id ? [id] : null);
  // ⚠️ In this case, `user` can also be `undefined`!
  return <>{user ? user.name : "Unknown"}</>;
};
```

## Error handling

Errors that occur in any async loader function can be handled with regular error
boundaries. **With only one exception**. When you have implemented a
retry-render-mechanism in your error fallback view, the erroneous resource has
to be refreshed as well before re-rendering.

When you use the popular
[`react-error-boundary`](https://www.npmjs.com/package/react-error-boundary)
package, you can utilize its `onReset` property to refresh all erroneous
resources, while resetting the error view.

Example of refreshing erroneous resources on reset:

```jsx
// ...
import { refresh } from "@mittwald/react-use-promise";
import { ErrorBoundary } from "react-error-boundary";

const App = () => (
  <MainLayout>
    <MainMenu />
    <ErrorBoundary
      fallback={<MainContentErrorFallback />}
      onReset={() => {
        refresh({ error: true });
      }}
    >
      <Suspense fallback={<MainContentLoadingSkeleton />}>
        <MainContent />
      </Suspense>
    </ErrorBoundary>
  </MainLayout>
);
```

## Best practices

- Use async resources as deep in the component tree as possible (see
  [Lazy loading with Async Resources](#-lazy-loading-with-async-resources)).
- In larger applications use factory methods for your async resources. The
  [`resourceify`](#resourceify) function helps you to quickly set up your
  factory methods.
- Add tags to your resources for a nuanced refreshing. You can even listen on
  backend-events (maybe pushed via a socket-connection) to invalidate the
  resources used in your session.
- Use models for a coherent interaction with your business models. This is a
  good practice in general, when your app has to deal with a large business
  model.

```tsx
// File resources/user.ts
import { getUserProfile } from "../resources/user";
import { resourceify } from "@mittwald/react-use-promise";

export const getUserProfile = resourceify(apiClient.loadUserProfile);

// File models/UserProfile.ts
import { getUserProfile } from "../resources/user";
// ...

export class UserProfile {
  public readonly id: string;
  public readonly firstName: string;
  public readonly lastName: string;

  public constructor(data: UserProfileApiData) {
    this.id = data.id;
    this.firstName = data.firstName;
    this.lastName = data.lastName;
  }

  public static useLoadById(id: string): UserProfile {
    const data = getUserProfile([id]).use();
    return new UserProfile(data);
  }

  public getFullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  public async updateName(firstName: string, lastName: string): Promise<void> {
    await apiClient.updateProfile({
      firstName,
      lastName,
    });
  }
}

// File components/UserProfileName.tsx
import { UserProfile } from "../models/UserProfile";

export const UserProfileName: FC<{ id: string }> = (props) => {
  const user = UserProfile.useLoadById(props.id);
  return <>{user.getFullName()}</>;
};
```

## Migration guides

### V1 to V2

- For more naming consistency the `.watch()` method of the Async Resource has
  changed to `.use()`. Replace all usages of `watch()` with `use()`.
