<?php namespace ImbaSynergy\OctoberSpa;

use System\Classes\PluginBase;

class Plugin extends PluginBase
{
    public function registerComponents()
    {
        return [
            'ImbaSynergy\OctoberSpa\Components\Spa' => 'makeSpa'
        ];
    }

    public function registerSettings()
    {
    }
}
