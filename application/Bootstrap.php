<?php

class Bootstrap extends Zend_Application_Bootstrap_Bootstrap
{
    protected function _initDoctype()
    {
        $documentType = new Zend_View_Helper_Doctype();
        $documentType->doctype(Zend_View_Helper_Doctype::HTML5);
    }
}

