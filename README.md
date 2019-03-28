# Readme (v0.2)

## Использование плагина:
- Подключите компонент плагина October SPA на нужные страницы, или на layout файл,
чтобы использовать его возможности на всех страницах сразу.

- Поместите контент, который изменяется при переходе между страницами в блок с id `#spa-page-content`, *например*: 
    ```html
    <div id="spa-page-content">
        {% page %}
    </div>.
    ```
- Чтобы добавить AJAX переход на страницу, добавьте ссылке с её адресом класс `.spa-link`, *например*: 
    ```html
    <a href="{{ 'home'|page }}" class="spa-link">Home</a>
    ```
- Также вы можете добавить класс `.spa-link` любому блоку и AJAX переход будет
осуществляться по всем ссылкам, содержащимся в нем! 

    *Пример:*
    ```html
    <nav class="spa-link">
        <a href="{{ 'home'|page }}">Home</a>
        <a href="{{ 'contact_us'|page }}">Contact Us</a>
        <a href="{{ 'about'|page }}">About</a>
        <a href="{{ 'whatever'|page }}">Etc...</a>
    </nav>
    ```
    *или даже:*
    ```html
    <body class="spa-link">
        <!-- Your layout  -->
    </body>
    ```      
    
    >**Примечание** *- плагин не обрабатывает "якоря" и ссылки-заглушки, такие как:* 
    `<a href="#">Just a link</a>`, 
    `<a href="#services">Services</a>`
    *и подобные.*