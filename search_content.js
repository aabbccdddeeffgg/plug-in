window.onload = function() {
    const searchInput = document.getElementById("txt_search"); // 获取 id 为 txt_search 的输入框
    const searchButtons1 = document.getElementsByClassName("search-btn"); // 获取类名为 search-btn 的搜索按钮
    const searchButton1 = searchButtons1[0]; 
    const searchButtons2 = document.getElementsByClassName("btn-result-search"); // 获取类名为 btn-result-search 的"结果中搜索"按钮
    const searchButton2 = searchButtons2[0]; 
    
    createPicture(searchInput.value); //这里直接把首页搜索的内容插入节点
    
    if (searchInput && searchButton1 && searchButton2) { // 确保元素存在
        // 监听输入框的键盘事件
        searchInput.addEventListener('keypress', function(event) {
            if (event.key === 'Enter') {
                handleSearch(event);
            }
        });
        // 监听按钮的点击事件
        searchButton1.addEventListener('click', function(event) {
            handleSearch(event);
        });
        // 监听按钮的点击事件
        searchButton2.addEventListener('click', function(event) {
            handleSearch(event);
        });
    }
    function inseartPicture() {
        //实现图片插入，图片应该为静态的
    }
    function createPicture(userInput) {
        //实现插入节点
        const imgElement = document.createElement('h1');
        imgElement.innerText = userInput;
        const insertPoint = document.getElementById("ModuleSearch");
        if (insertPoint) {
            insertPoint.parentNode.insertBefore(imgElement, insertPoint.nextSibling); // 插入到搜索框的下方
        }
    }
    // 处理搜索逻辑的函数
    function handleSearch(event) {
        const userInput = event.target === searchInput ? event.target.value : searchInput.value;
        createPicture(userInput);
    }
}

