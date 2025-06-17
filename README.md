# Aplicação de Afinador

Uma Web App de afinador de instrumentos musicais , que utiliza a Web Audio API para detetar a frequência do som captado pelo microfone e exibir a nota correspondente, juntamente com um indicador visual de afinação.
Disponível em https://carlosf21.github.io/Tuner/.

## Funcionalidades

* **Deteção de Pitch em Tempo Real:** Utiliza o algoritmo Fast Fourier Transform (FFT) para analisar o áudio do microfone e detetar a frequência fundamental.
* **Exibição da Nota:** Mostra a nota musical mais próxima da frequência detetada.
* **Exibição da Frequência:** Apresenta a frequência exata em Hertz (Hz).
* **Indicador Visual de Afinação:** Uma barra interativa com um ponteiro que se move para a esquerda (grave), direita (agudo) ou fica no centro (afinada), mudando de cor para feedback instantâneo.
* **Controlo de Início:** O afinador só inicia a captação de áudio após o clique de um botão, garantindo o controlo do utilizador sobre o acesso ao microfone.
* **Gestão de Erros:** Mensagens claras para erros comuns, como permissão de microfone negada ou nenhum dispositivo de microfone encontrado.
* **Limpeza de Recursos:** Garante que o microfone e o `AudioContext` são corretamente fechados quando o componente é desmontado.

## Como Utilizar

1.  **Aceder à Aplicação:** Abra a aplicação no seu navegador (normalmente `http://localhost:3000` se estiver a correr localmente).
2.  **Iniciar Afinador:** Clique no botão "Iniciar Afinador".
3.  **Permissão do Microfone:** O navegador irá pedir permissão para aceder ao seu microfone. **Conceda a permissão** para que o afinador possa funcionar.
4.  **Toque/Cante:** Comece a tocar uma nota num instrumento ou cante uma nota perto do microfone do seu dispositivo.
5.  **Observe o Feedback:**
    * A **Nota** e a **Frequência** serão exibidas.
    * O **ponteiro na barra** indicará se a sua nota está:
        * **À esquerda e vermelho:** Demasiado baixa (flat/grave).
        * **No centro e verde:** Afinada (in tune/no tom).
        * **À direita e vermelho:** Demasiado alta (sharp/aguda).
    * Ajuste a sua afinação até que o ponteiro fique no centro e verde.

## Estrutura do Projeto

* `src/Tuner.js`: O componente React principal que gere o estado do afinador, a lógica de inicialização do áudio (Web Audio API) e a interface de utilizador. Contém também o algoritmo de deteção de frequência baseado em FFT.
* `src/noteUtils.js`: Funções utilitárias para converter frequências em notas musicais e calcular o desvio em cents (para o indicador de afinação).
* `src/Tuner.css`: Os estilos CSS para a aparência do afinador, incluindo a barra de afinação visualmente apelativa.
* `src/index.js`: O ponto de entrada da aplicação React.

## Tecnologias Utilizadas

* **React:** Para a construção da interface de utilizador.
* **Web Audio API:** Para aceder ao microfone e processar o áudio em tempo real (utilizando `AudioContext`, `AnalyserNode`).
* **Fast Fourier Transform (FFT):** Algoritmo de processamento de sinal digital utilizado para converter o sinal de áudio do domínio do tempo para o domínio da frequência, permitindo a deteção do pitch.
* **HTML/CSS:** Para a estrutura e estilização da aplicação.

## Configuração e Execução

Para executar este projeto localmente, siga estes passos:

1.  **Clone o repositório**:

    ```bash
    git clone <URL>
    cd tuner-app
    ```

2.  **Instale as dependências:**

    ```bash
    npm install
    ```

3.  **Inicie a aplicação:**

    ```bash
    npm start
    ```

    Isto abrirá a aplicação no seu navegador em `http://localhost:3000` (ou uma porta disponível).