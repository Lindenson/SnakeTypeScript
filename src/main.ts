import $ from "jquery";

// Constants
const background: string = "#ede3ce";
const snakeColor: string = "#c2db5e";
const swallow = new Audio('./swallow.mp3');
const snakeEats = "snakeeat.png";
const snakeMoves = "snakemove.png";
const mouse = "mouse.png";
const STEP_RATE_SECONDS = 300;
const MOUSE_RATE_SECONDS = 5000;


interface Position {
    x: number;
    y: number;
}

class Chunk implements Position {
    x: number;
    y: number;
    d: number;

    constructor(x: number, y: number, d: number) {
        this.x = x;
        this.y = y;
        this.d = d;
    }
}

class Mouse implements Position {
    x: number;
    y: number;

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }
}

interface Draw {
    paint(x: number, y: number, picture?: Picture): void;
}

class Painter implements Draw {
    public paint(x: number, y: number, picture: Picture = Picture.None): void {
        const id = `r${x}c${y}`;
        const cell = $(`#${id}`);
        cell.css({});

        switch (picture) {
            case Picture.Mouse:
                cell.css({"background-image": "url(./" + mouse + ")", "background-size": "40px"});
                break;
            case Picture.SnakeHead:
                cell.css({"background-image": "url(./" + snakeMoves + ")", "background-size": "40px"});
                break;
            case Picture.SnakeEat:
                cell.css({"background-image": "url(./" + snakeEats + ")", "background-size": "40px"});
                break;
            case Picture.SnakeBody:
                cell.css("background", snakeColor);
                break;
            case Picture.None:
                cell.css("background", background);
                break;
        }
    }
}

enum Picture {
    Mouse = 1,
    SnakeHead,
    SnakeBody,
    SnakeEat,
    None
}

class Play {
    private direction : number;
    private painter: Draw;

    private readonly snake: Chunk[];
    private readonly mice: Mouse[];
    private readonly running: number | undefined;
    private readonly mousing: number | undefined;

    constructor(stepRate: number, mouseRate: number, painter: Draw) {
        this.painter = painter;

        let x: number = Math.floor(Math.random() * 12);
        let y: number = Math.floor(Math.random() * 12);

        this.snake = [];
        this.mice = [];
        this.direction = 2;
        let head = new Chunk(x, y, this.direction);
        let tail = new Chunk(x + 1, y, this.direction);

        this.snake.push(head);
        this.snake.push(tail);
        this.painter.paint(head.x, head.y, Picture.SnakeHead);
        this.painter.paint(tail.x, tail.y, Picture.SnakeBody);

        this.running = setInterval(() => this.move(), stepRate);
        this.mousing = setInterval(() => this.mouse(), mouseRate);
        $("body").on("keydown", (event: JQuery.Event) => this.control(event));
    }



    private stopAndShowDialog(): void {
        clearInterval(this.running);
        clearInterval(this.mousing);

        $("#button").on("click", ()=> {
            $("#forDialog").css("visibility", "hidden");
            window.location.reload();
        });

        $("#points").html(`getting ${this.snake.length - 2} points`);
        $("#forDialog").css("visibility", "visible");
    }

    public move(): void {
        const head = this.snake[0];
        const tail = this.snake[this.snake.length - 1];

        let keyboardD = this.direction;
        let headX = head.x;
        let headY = head.y;
        const headD = head.d;

        if (Math.abs(keyboardD - headD) === 2) {
            keyboardD = headD; // Prevent 180-degree turns
        }

        switch (keyboardD) {
            case 4:
                headY--;
                break;
            case 3:
                headX++;
                break;
            case 1:
                headX--;
                break;
            case 2:
                headY++;
                break;
        }

        const eat = this.checkMouse(headX, headY);

        if (eat) {
            swallow.play().then(() => console.log("nyam..."));
            this.snake.push(new Chunk(tail.x, tail.y, tail.d));
        } else {
            this.painter.paint(tail.x, tail.y, Picture.None);
        }

        for (let i = this.snake.length - 1; i > 0; i--) {
            this.snake[i].x = this.snake[i - 1].x;
            this.snake[i].y = this.snake[i - 1].y;
        }

        this.painter.paint(head.x, head.y, Picture.SnakeBody);

        head.d = keyboardD;
        head.x = headX;
        head.y = headY;

        if (head.x < 0) head.x = 11;
        if (head.y < 0) head.y = 11;
        if (head.x > 11) head.x = 0;
        if (head.y > 11) head.y = 0;

        this.painter.paint(head.x, head.y, eat ? Picture.SnakeEat : Picture.SnakeHead);

        if (this.checkSnake(head.x, head.y, 1)) {
            this.stopAndShowDialog();
        }
    }

    public control(event: JQuery.Event): void {
        switch (event.key) {
            case "ArrowUp":
                this.direction = 1;
                break;
            case "ArrowDown":
                this.direction = 3;
                break;
            case "ArrowLeft":
                this.direction = 4;
                break;
            case "ArrowRight":
                this.direction = 2;
                break;
        }
    }

    private mouse(): void {
        const x = Math.floor(Math.random() * 12);
        const y = Math.floor(Math.random() * 12);

        if (this.checkMouse(x, y)) return;

        const mouse = new Mouse(x, y);
        this.mice.push(mouse);
        this.painter.paint(x, y, Picture.Mouse);
    }

    private checkMouse(x: number, y: number): boolean {
        return this.mice.some(mouse => mouse.x === x && mouse.y === y) || this.checkSnake(x, y);
    }

    private checkSnake(x: number, y: number, from: number = 0): boolean {
        return this.snake.slice(from).some(segment => segment.x === x && segment.y === y);
    }
}

// Start
export function run(){
    new Play(STEP_RATE_SECONDS, MOUSE_RATE_SECONDS, new Painter());
}






