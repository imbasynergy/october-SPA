<?php 
namespace Imbasynergy\Octoberspa\Components;

class Spa extends \Cms\Classes\ComponentBase
{
    public function componentDetails()
    {
        return [
            'name' => 'October SPA',
            'description' => 'Makes your website single-page.'
        ];
    }

    public function onRun()
    {
        $this->addJs('/plugins/imbasynergy/octoberspa/assets/js/tabSignal.js');
        $this->addJs('/plugins/imbasynergy/octoberspa/assets/js/spa.js');
    }
}