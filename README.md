## Plugin usage:
- Add `[makeSpa]` component to your layout file to enable plugin features.

- Place 'reloadable' content in a container with id `#spa-page-content`, *for example*: 
    ```
    <div id="spa-page-content">
        {% page %}
    </div>
    ```
- Add `.spa-link` class to any link you need to handle with OctoberSPA plugin *for example*: 
   ```
    <a href="{{ 'home'|page }}" class="spa-link">Home</a>
    ```
   **Note** *- plugin doesn't handle "anchors" and blank links such as:* 
   ```
    <a href="#">Just a link</a>
    <a href="#services">Services</a>
    ```
- You can also add `.spa-link` class to any block so that OctoberSPA handles all the links it contains! 

    *Example:*
    ```
    <nav class="spa-link">
        <a href="{{ 'home'|page }}">Home</a>
        <a href="{{ 'contact_us'|page }}">Contact Us</a>
        <a href="{{ 'about'|page }}">About</a>
        <a href="{{ 'whatever'|page }}">Etc...</a>
    </nav>
    ```
    *or even:*
    ```
    <body class="spa-link">
        <!-- Your layout  -->
    </body>
    ```