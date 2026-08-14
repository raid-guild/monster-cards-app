# Monsters

MVP web app that uses AI to visualize an text based nft that describes a monster.

Main user flow

- web3 login with rainbow kit (ie metamask)
- check the connected wallet address to see if it holds a monster nft. balanceOf on 0xecb9b2ea457740fbde58c758e4c574834224413e
- display nft image from tokenURI of all monster nfts the wallet holds
- allow the user to select an nft to visualize
- this will prompt an ai image generation model with the monster description from the nft and a set prompt so we get consistent styles
- it will return the image, we need to save it somewhere and keep track of converted monsters in a light weight database.
- the converted nft is now displayed and hte user can flip the image over to see the original

Other features

- An explore page to see all converted nfts
- an about page with some links to the original nft contract and opensea page

Tech requirements

- we will use an existing database deployed in railway we use for raid guild games. this table can be name spaced so it's only for this
- need to explore image starage options and image gen models to use
- next.js react app with tailwind/shadcn for components and styling

Styling
We should derive styles from the art work in monster-card-2.jpg and more-card.png

## Resources

NFT contract
https://etherscan.io/address/0xecb9b2ea457740fbde58c758e4c574834224413e

Collection on opensea:
https://opensea.io/collection/monsters-7vx3cc5ojl

example of the tokenuri of an nft

```
data:application/json;base64,eyJuYW1lIjogIlNoZWV0ICMxIiwgImRlc2NyaXB0aW9uIjogIk1vbnN0ZXIgVHJhaXRzIGFyZSByYW5kb21pemVkIHRyYWl0cyBnZW5lcmF0ZWQgYW5kIHN0b3JlZCBvbiBjaGFpbi4gTW9uc3RlcnMgaGF2ZSBiZWVuIGtub3duIHRvIG9jY3VweSB3YXlwb2ludHMgb24gYW4gYWR2ZW50dXJlcnMgbWFwLiBGZWVsIGZyZWUgdG8gdXNlIE1vbnN0ZXIgVHJhaXRzIGluIGFueSB3YXkgeW91IHdhbnQuIiwgImltYWdlIjogImRhdGE6aW1hZ2Uvc3ZnK3htbDtiYXNlNjQsUEhOMlp5QjRiV3h1Y3owaWFIUjBjRG92TDNkM2R5NTNNeTV2Y21jdk1qQXdNQzl6ZG1jaUlIQnlaWE5sY25abFFYTndaV04wVW1GMGFXODlJbmhOYVc1WlRXbHVJRzFsWlhRaUlIWnBaWGRDYjNnOUlqQWdNQ0F6TlRBZ016VXdJajQ4YzNSNWJHVStMbUpoYzJVZ2V5Qm1hV3hzT2lBalptWXpPRFkwT3lCbWIyNTBMV1poYldsc2VUb2djMlZ5YVdZN0lHWnZiblF0YzJsNlpUb2dNVFJ3ZURzZ2ZUd3ZjM1I1YkdVK1BISmxZM1FnZDJsa2RHZzlJakV3TUNVaUlHaGxhV2RvZEQwaU1UQXdKU0lnWm1sc2JEMGlZbXhoWTJzaUlDOCtQSFJsZUhRZ2VEMGlNVEFpSUhrOUlqSXdJaUJqYkdGemN6MGlZbUZ6WlNJK1FXTnBaQ0JCYm5RZ1ZHaGxJRk5wYldsaGJpQnZaaUJVYUdVZ1ZtbHNiR0ZuWlR3dmRHVjRkRDQ4ZEdWNGRDQjRQU0l4TUNJZ2VUMGlOREFpSUdOc1lYTnpQU0ppWVhObElqNVRhWHBsT2lCVVlXeHNQQzkwWlhoMFBqeDBaWGgwSUhnOUlqRXdJaUI1UFNJMk1DSWdZMnhoYzNNOUltSmhjMlVpUGtGc2FXZHViV1Z1ZERvZ1RHRjNablZzSUVkdmIyUThMM1JsZUhRK1BIUmxlSFFnZUQwaU1UQWlJSGs5SWpnd0lpQmpiR0Z6Y3owaVltRnpaU0krUVdOMGFXOXVjem9nVUdGeVlXeDVlbWx1WnlCVWIzVmphQ3dnVFdGbmFXTmhiQ0JDZFhKaWJHVThMM1JsZUhRK1BIUmxlSFFnZUQwaU1UQWlJSGs5SWpFd01DSWdZMnhoYzNNOUltSmhjMlVpUGxOd1pXTnBZV3dnUVdKcGJHbDBlVG9nUzJWbGJpQlRaVzV6WlhNOEwzUmxlSFErUEhSbGVIUWdlRDBpTVRBaUlIazlJakV5TUNJZ1kyeGhjM005SW1KaGMyVWlQbGRsWVd0dVpYTnpPaUJFWVhKcmJtVnpjend2ZEdWNGRENDhkR1Y0ZENCNFBTSXhNQ0lnZVQwaU1UUXdJaUJqYkdGemN6MGlZbUZ6WlNJK1RHOWpiMjF2ZEdsdmJqb2dVMnhwZEdobGNqd3ZkR1Y0ZEQ0OGRHVjRkQ0I0UFNJeE1DSWdlVDBpTVRZd0lpQmpiR0Z6Y3owaVltRnpaU0krVEdGdVozVmhaMlU2SUZKaGRHWnZiR3NzSUZKdllXTm9iR2x1Wnl3Z1FtVmhjM1FzSUZOb2IzUm9MQ0JMY25sMFBDOTBaWGgwUGp3dmMzWm5QZz09In0=
```

resolves to

```json
{
  "name": "Sheet #1",
  "description": "Monster Traits are randomized traits generated and stored on chain. Monsters have been known to occupy waypoints on an adventurers map. Feel free to use Monster Traits in any way you want.",
  "image": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHByZXNlcnZlQXNwZWN0UmF0aW89InhNaW5ZTWluIG1lZXQiIHZpZXdCb3g9IjAgMCAzNTAgMzUwIj48c3R5bGU+LmJhc2UgeyBmaWxsOiAjZmYzODY0OyBmb250LWZhbWlseTogc2VyaWY7IGZvbnQtc2l6ZTogMTRweDsgfTwvc3R5bGU+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iYmxhY2siIC8+PHRleHQgeD0iMTAiIHk9IjIwIiBjbGFzcz0iYmFzZSI+QWNpZCBBbnQgVGhlIFNpbWlhbiBvZiBUaGUgVmlsbGFnZTwvdGV4dD48dGV4dCB4PSIxMCIgeT0iNDAiIGNsYXNzPSJiYXNlIj5TaXplOiBUYWxsPC90ZXh0Pjx0ZXh0IHg9IjEwIiB5PSI2MCIgY2xhc3M9ImJhc2UiPkFsaWdubWVudDogTGF3ZnVsIEdvb2Q8L3RleHQ+PHRleHQgeD0iMTAiIHk9IjgwIiBjbGFzcz0iYmFzZSI+QWN0aW9uczogUGFyYWx5emluZyBUb3VjaCwgTWFnaWNhbCBCdXJibGU8L3RleHQ+PHRleHQgeD0iMTAiIHk9IjEwMCIgY2xhc3M9ImJhc2UiPlNwZWNpYWwgQWJpbGl0eTogS2VlbiBTZW5zZXM8L3RleHQ+PHRleHQgeD0iMTAiIHk9IjEyMCIgY2xhc3M9ImJhc2UiPldlYWtuZXNzOiBEYXJrbmVzczwvdGV4dD48dGV4dCB4PSIxMCIgeT0iMTQwIiBjbGFzcz0iYmFzZSI+TG9jb21vdGlvbjogU2xpdGhlcjwvdGV4dD48dGV4dCB4PSIxMCIgeT0iMTYwIiBjbGFzcz0iYmFzZSI+TGFuZ3VhZ2U6IFJhdGZvbGssIFJvYWNobGluZywgQmVhc3QsIFNob3RoLCBLcnl0PC90ZXh0Pjwvc3ZnPg=="
}
```

can get the image from that json:

```
data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHByZXNlcnZlQXNwZWN0UmF0aW89InhNaW5ZTWluIG1lZXQiIHZpZXdCb3g9IjAgMCAzNTAgMzUwIj48c3R5bGU+LmJhc2UgeyBmaWxsOiAjZmYzODY0OyBmb250LWZhbWlseTogc2VyaWY7IGZvbnQtc2l6ZTogMTRweDsgfTwvc3R5bGU+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iYmxhY2siIC8+PHRleHQgeD0iMTAiIHk9IjIwIiBjbGFzcz0iYmFzZSI+QWNpZCBBbnQgVGhlIFNpbWlhbiBvZiBUaGUgVmlsbGFnZTwvdGV4dD48dGV4dCB4PSIxMCIgeT0iNDAiIGNsYXNzPSJiYXNlIj5TaXplOiBUYWxsPC90ZXh0Pjx0ZXh0IHg9IjEwIiB5PSI2MCIgY2xhc3M9ImJhc2UiPkFsaWdubWVudDogTGF3ZnVsIEdvb2Q8L3RleHQ+PHRleHQgeD0iMTAiIHk9IjgwIiBjbGFzcz0iYmFzZSI+QWN0aW9uczogUGFyYWx5emluZyBUb3VjaCwgTWFnaWNhbCBCdXJibGU8L3RleHQ+PHRleHQgeD0iMTAiIHk9IjEwMCIgY2xhc3M9ImJhc2UiPlNwZWNpYWwgQWJpbGl0eTogS2VlbiBTZW5zZXM8L3RleHQ+PHRleHQgeD0iMTAiIHk9IjEyMCIgY2xhc3M9ImJhc2UiPldlYWtuZXNzOiBEYXJrbmVzczwvdGV4dD48dGV4dCB4PSIxMCIgeT0iMTQwIiBjbGFzcz0iYmFzZSI+TG9jb21vdGlvbjogU2xpdGhlcjwvdGV4dD48dGV4dCB4PSIxMCIgeT0iMTYwIiBjbGFzcz0iYmFzZSI+TGFuZ3VhZ2U6IFJhdGZvbGssIFJvYWNobGluZywgQmVhc3QsIFNob3RoLCBLcnl0PC90ZXh0Pjwvc3ZnPg==
```

and that displays the traits we use with the image prompt. ie.)

```
Acid Ant The Simian of The Village
Size: Tall
Alignment: Lawful Good
Actions: Paralyzing Touch, Magical Burble
Special Ability: Keen Senses
Weakness: Darkness
Locomotion: Slither
Language: Ratfolk, Roachling, Beast, Shoth, Kryt
```

example of the image we want to use as a guide for the prompt: monster-card-2.jpg. we want all of the card to look like this with a character image in this style and the name/traits listed like this.

### Future considerations

- We'll want to be able to configure and tweak the image gen prompt so we could change the style down the line. I could see a future where there are a couple of tyles to choose from,

- We also have a map nft that will have a similar path. the original nft project was Monster & Maps. And we might later enable a story generation if the user holds both a monster and map. So 2 future generation paths to keep in mind.
