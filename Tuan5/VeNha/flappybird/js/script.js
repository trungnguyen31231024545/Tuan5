$(function () {
    // ======== Khai báo object =========
    var container = $('#container');
    var bird = $('#bird');
    var pole = $('.pole');
    var pole_1 = $('#pole_1');
    var pole_2 = $('#pole_2');
    var score = $('#score');
    var level_text = $('#level');
    var best_score = parseInt(localStorage.getItem('best_score')) || 0; 
    $('#best_score').text('Best: ' + best_score);

    // ======== Thông số game =========
    var container_width = parseInt(container.width());
    var container_height = parseInt(container.height());
    var pole_initial_position = parseInt(pole.css('right'));
    var pole_initial_height = parseInt(pole.css('height'));
    var bird_left = parseInt(bird.css('left'));
    var bird_height = parseInt(bird.height());
    var speed = 10;

    var go_up = false;
    var score_updated = false;
    var game_over = false;
    var level = 1;
    var interval_time = 40;
    var the_game;
    var powerups = [];
    var shield_active = false;
    var lives = 1;

    // ======== Power-up =========
    function createPowerup(type) {
        var pu = $('<div class="powerup"></div>');
        pu.attr('data-type', type);
        pu.css({
            top: Math.random() * (container_height - 40) + 20 + 'px',
            right: '-40px'
        });
        container.append(pu);
        powerups.push(pu);
    }

    setInterval(function(){
        if(!game_over && !$('#play_btn').is(':visible')){
            var types = ['coin','heart','slow','shield'];
            var type = types[Math.floor(Math.random()*types.length)];
            createPowerup(type);
        }
    }, 7000);

    // ======== Hàm cập nhật Level =========
    function updateLevel(current_score) {
        var new_level = 1;
        var new_interval = 40;

        if (current_score >= 50) {
            stop_the_game(true);
            return;
        } else if (current_score >= 40) {
            new_level = 4;
            new_interval = 20;
        } else if (current_score >= 20) {
            new_level = 3;
            new_interval = 25;
        } else if (current_score >= 5) {
            new_level = 2;
            new_interval = 30;
        }

        if (new_level !== level || new_interval !== interval_time) {
            level = new_level;
            interval_time = new_interval;
            level_text.text("Level: " + level);
            if (!game_over) startGame(); // chỉ restart nếu đang chơi
        }
    }

    // ======== Game Loop =========
    function startGame() {
        clearInterval(the_game);
        the_game = setInterval(gameLoop, interval_time);
    }

    function gameLoop() {
        if (game_over) return;

        // === Va chạm ===
        var bird_top = parseInt(bird.css('top'));
        if (collision(bird, pole_1) || collision(bird, pole_2) ||
            bird_top <= 0 || bird_top + bird_height >= container_height) {
            if (shield_active) {
                shield_active = false;
            } else {
                stop_the_game(false);
                return;
            }
        }

        // === Di chuyển ống ===
        var pole_current_position = parseInt(pole.css('right'));
        var new_pos = pole_current_position + speed;
        pole.css('right', new_pos);

        // Reset ống
        if (new_pos > container_width) {
            var new_height = parseInt(Math.random() * 100);
            pole_1.css('height', pole_initial_height + new_height);
            pole_2.css('height', pole_initial_height - new_height);
            score_updated = false;
            pole.css('right', pole_initial_position);
        }

        // Cập nhật điểm
        if (new_pos > container_width - bird_left - 60 && !score_updated) {
            var new_score = parseInt(score.text()) + 1;
            score.text(new_score);
            score_updated = true;
            updateLevel(new_score);
        }

        // Chim rơi
        if (!go_up) go_down();

        // === Power-ups ===
        for (var i = powerups.length - 1; i >= 0; i--) {
            var pu = powerups[i];
            var pu_pos = parseInt(pu.css('right'));
            pu.css('right', pu_pos + speed);

            if (collision(bird, pu)) {
                var type = pu.attr('data-type');
                if (type === 'coin') {
                    var s = parseInt(score.text()) + 5;
                    score.text(s);
                    updateLevel(s);
                } else if (type === 'heart') {
                    lives += 1;
                } else if (type === 'slow') {
                    clearInterval(the_game);
                    interval_time += 20;
                    startGame();
                    setTimeout(function() {
                        if (!game_over) {
                            interval_time -= 20;
                            startGame();
                        }
                    }, 5000);
                } else if (type === 'shield') {
                    shield_active = true;
                    setTimeout(() => { shield_active = false; }, 5000);
                }
                pu.remove();
                powerups.splice(i, 1);
            } else if (pu_pos > container_width) {
                pu.remove();
                powerups.splice(i, 1);
            }
        }
    }

    // ======== Chim bay / rơi =========
    function go_down() {
        bird.css('top', parseInt(bird.css('top')) + 10);
        bird.css('transform', 'rotate(50deg)');
    }

    function up() {
        bird.css('top', parseInt(bird.css('top')) - 20);
        bird.css('transform', 'rotate(-10deg)');
    }

    // ======== Điều khiển =========
    var up_interval = null;
    $(document).keydown(function(e){
        if (e.key === "ArrowDown" && !up_interval && !game_over && $('#play_btn').is(':hidden')) {
            up_interval = setInterval(up, 40);
        }
    });
    $(document).keyup(function(e){
        if (e.key === "ArrowDown" && up_interval) {
            clearInterval(up_interval);
            up_interval = null;
        }
    });

    // ======== Chơi lại =========
    $('#restart_btn').click(function(){
        location.reload();
    });

    // ======== Bắt đầu game =========
    $('#play_btn').click(function(){
        $(this).hide();
        startGame();
    });

    // ======== Dừng game =========
    function stop_the_game(victory){
        clearInterval(the_game);
        game_over = true;
        var current_score = parseInt(score.text());
        if (current_score > best_score) {
            best_score = current_score;
            localStorage.setItem('best_score', best_score);
            $('#best_score').text('Best: ' + best_score);
        }
        if (victory) {
            alert("Chúc mừng bạn đã chiến thắng Level 4!");
        } else {
            alert("Game Over! Điểm: " + current_score);
        }
        $('#restart_btn').slideDown();
    }

    // ======== Va chạm =========
    function collision($div1, $div2){
        var x1 = $div1.offset().left;
        var y1 = $div1.offset().top;
        var h1 = $div1.outerHeight(true);
        var w1 = $div1.outerWidth(true);
        var b1 = y1 + h1;
        var r1 = x1 + w1;

        var x2 = $div2.offset().left;
        var y2 = $div2.offset().top;
        var h2 = $div2.outerHeight(true);
        var w2 = $div2.outerWidth(true);
        var b2 = y2 + h2;
        var r2 = x2 + w2;

        if (b1 < y2 || y1 > b2 || r1 < x2 || x1 > r2) return false;
        return true;
    }
});