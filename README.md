# Input with dynamic attributes

Try at https://dynamic-input.aziznal.com

An (unfinished) attempt at creating a dynamic input with attributes like Todoist's

![Todoist's dynamic input allowing for assigning a todo's attributes with text](./public/todoist-example.png)

## Why did I stop?

I found no way to implement things easily.

I tried two routes:

### 1. The "Segments" method

There are text segments and attribute segments. They can be mixed in any order. Each is a component.

Both segment types are inputs sized to fit the text inside them, with attribute segments being styled differently.

This was going well until I decided to find a simpler way using `contenteditable`...

Some of the things that caused to me seek an alternative were:

- Having to implement my own undo
- Text selection being weird
- Bad mobile support (especially in text selection)

### 2. `contenteditable` div

It's simple: a `<div contenteditable />` allows you to have one input looking thing
but you can put whatever html you want in there.

Sounds great, doesn't hold up in reality.

To understand why, try the following:

- Create this:

```html
<div contenteditable>some text here <span>initial text</span></div>
```

- add an `onInput=` listener to print its contents when you type something in the next steps.
- Focus on the editable div. Where is your cursor?
- Write something, press enter
- Select a word and make it bold (definitely try this on different browsers too)
- Copy some text and paste it

I have thus stopped working on this to preserve my sanity.

Go donate some money to whatever open-source WYSIWYG editor you're using.
