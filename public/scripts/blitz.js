
document.getElementById("open_btn").addEventListener("click", function () {
    document.getElementById("sidebar").classList.toggle("open-sidebar");
  });



  document.addEventListener('DOMContentLoaded', function () {
    const addLinkButton = document.getElementById('add_links');
    const addLinkBox = document.getElementById('addLinkBox');
    const cancelLinkButton = document.getElementById('cancelLinkButton');
    const confirmLinkButton = document.getElementById('confirmLinkButton');
    const newTextInput = document.getElementById('newText');
    const newLinkInput = document.getElementById('newLink');
    const linkList = document.querySelector('.links ul');
    const inLinkHidden = document.getElementById('inLinkHidden'); // campo oculto
  
    let linksArray = []; // Array para armazenar os links
  
    if (addLinkButton && addLinkBox && cancelLinkButton && confirmLinkButton && newTextInput && newLinkInput && linkList && inLinkHidden) {
      addLinkButton.addEventListener('click', () => {
        addLinkBox.classList.remove('hidden');
      });
  
      cancelLinkButton.addEventListener('click', () => {
        newTextInput.value = '';
        newLinkInput.value = '';
        addLinkBox.classList.add('hidden');
      });
  
      confirmLinkButton.addEventListener('click', () => {
        const textValue = newTextInput.value.trim();
        const linkValue = newLinkInput.value.trim();
  
        if (textValue && linkValue) {
          if (isValidURL(linkValue)) {
            const li = document.createElement('li');
            const link = document.createElement('a');
            link.href = linkValue;
            link.textContent = textValue;
            link.target = '_blank';
  
            const removeButton = document.createElement('button');
            removeButton.classList.add('remove_links');
            removeButton.innerHTML = '<i class="fa fa-times-circle"></i>';
  
            removeButton.addEventListener('click', () => {
              li.remove();
              linksArray = linksArray.filter(item => item.link !== linkValue); // Remove o link do array
              updateHiddenInput();
            });
  
            li.appendChild(link);
            li.appendChild(removeButton);
            linkList.appendChild(li);
  
            // Adiciona o link ao array
            linksArray.push({ text: textValue, link: linkValue });
            updateHiddenInput(); // Atualiza o input oculto
  
            newTextInput.value = '';
            newLinkInput.value = '';
            addLinkBox.classList.add('hidden');
          } else {
            alert('Por favor, insira um link válido (começando com http:// ou https://).');
          }
        } else {
          alert('Por favor, preencha ambos os campos.');
        }
      });
  
      function updateHiddenInput() {
        // Concatena os links no formato "Texto:Link"
        inLinkHidden.value = linksArray.map(item => `${item.text}<<!separacao!>>${item.link}`).join(',');
      }
  
      function isValidURL(url) {
        const regex = /^(https?:\/\/)[^\s$.?#].[^\s]*$/i;
        return regex.test(url);
      }
    } else {
      console.error('Elementos necessários não encontrados no DOM.');
    }
  });
  



  
/*  
document.addEventListener('DOMContentLoaded', function() {
const addLinkButton = document.getElementById('add_links');
const addLinkBox = document.getElementById('addLinkBox');
const cancelLinkButton = document.getElementById('cancelLinkButton');
const confirmLinkButton = document.getElementById('confirmLinkButton');
const newTextInput = document.getElementById('newText');
const newLinkInput = document.getElementById('newLink');
const linkList = document.querySelector('.links ul');

if (addLinkButton && addLinkBox && cancelLinkButton && confirmLinkButton && newTextInput && newLinkInput && linkList) {
  
  addLinkButton.addEventListener('click', () => {
    addLinkBox.classList.remove('hidden');
  });

  cancelLinkButton.addEventListener('click', () => {
    newTextInput.value = '';
    newLinkInput.value = '';
    addLinkBox.classList.add('hidden');
  });

  
  confirmLinkButton.addEventListener('click', () => {
    const textValue = newTextInput.value.trim();
    const linkValue = newLinkInput.value.trim();

    if (textValue && linkValue) {
      // Cria o item da lista
      const li = document.createElement('li');
      
      // Cria o link
      const link = document.createElement('a');
      link.href = linkValue;
      link.textContent = textValue;
      link.target = '_blank';

      // Cria o botão de remoção (X)
      const removeButton = document.createElement('button');
      removeButton.classList.add('remove_links');  // Adiciona a classe para estilização
      removeButton.innerHTML = '<i class="fa fa-times-circle"></i>';

      // Adiciona o evento de remoção ao botão
      removeButton.addEventListener('click', () => {
        li.remove(); // Remove o item da lista quando o botão for clicado
      });

      // Adiciona o link e o botão "X" ao item da lista
      li.appendChild(link);
      li.appendChild(removeButton);
      linkList.appendChild(li);

      // Limpa os campos de texto e esconde o box de adição de links
      newTextInput.value = '';
      newLinkInput.value = '';
      addLinkBox.classList.add('hidden');
    } else {
      alert('Por favor, preencha ambos os campos.');
    }
  });








  
} else {
  console.error("Elementos necessários não encontrados no DOM.");
}
});

*/


function mostrarAlerta() {
  var alerta = document.getElementById('alerta');
  var barra = document.getElementById('barraProgresso');

  alerta.style.display = 'block';

  // Reseta a animação da barra de progresso
  barra.style.animation = 'none';
  setTimeout(function() {
      barra.style.animation = '';
  }, 2);

  // Esconde o alerta após 5 segundos
  setTimeout(function() {
      alerta.style.display = 'none';
  }, 2000);
}