# TypeScript Types to Swagger(YAML) Schema

I can't find an app where I can convert TS Type to YAML, so I made this.
Currently It's works with simple types/interfaces/enums

## Example:

### Input:
```ts
type UserType = {
      username: string;
      email: string;
      avatar?: string;
      bot?: boolean;
      system?: boolean;
      accent_colors?: string;
      locale?: string;
      verified?: boolean;
};
```
### Output: 
```yaml
UserType: 
  type: object
  properties: 
    username: 
      type: object
    email: 
      type: object
    avatar: 
      type: object
    bot: 
      type: object
    system: 
      type: object
    accent_colors: 
      type: object
    locale: 
      type: object
    verified: 
      type: object

  required: 
    - avatar
    - bot
    - system
    - accent_colors
    - locale
    - verified
```
