var Layout = function()
{
    var mover = document.querySelector('.slides_move');

    this.init = function(controller)
    {
        this.controller = controller;
        this.bind();
    };

    this.display_right= function()
    {
        mover.className='slides_move right_visible';
    };
    this.display_center= function()
    {
        mover.className='slides_move center_visible';
    };

    this.bind =  function()
    {
        var buttons=  document.querySelectorAll('.header button');

        Array.forEach( buttons, function(button)
        {
            button.addEventListener('click', function()
            {
                var slide_class = this.getAttribute('data-slide')+'_visible';
                Array.forEach( buttons, function(button)
                {
                    button.classList.remove('selected');
                });

                if(!mover.classList.contains(slide_class))
                {
                    this.classList.add('selected');
                    mover.className='slides_move '+slide_class;
                }
                else
                {
                    mover.className='slides_move center_visible';
                }
            });
        });
    };
};

