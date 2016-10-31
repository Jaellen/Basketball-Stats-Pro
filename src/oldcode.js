//Helper functions - creates DOM elem with class and id name

var createDOMElem = function(tag, name) {
                var elem = document.createElement(tag);
                elem.id = name;
                elem.classList.add(name);
                return elem;
            };