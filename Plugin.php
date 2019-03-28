<?php namespace Imbasynergy\OctoberSpa;

use System\Classes\PluginBase;

class Plugin extends PluginBase
{
    public function registerComponents()
    {
        return [
            'Imbasynergy\OctoberSpa\Components\Spa' => 'makeSpa'
        ];
    }

    public function registerSettings()
    {
    }
}
