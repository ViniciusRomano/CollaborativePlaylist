import {
    Template
} from 'meteor/templating';
import {
    Materialize
} from 'meteor/materialize:materialize';

import {
    MaterializeModal
} from 'meteor/meteorstuff:materialize-modal';

Template.List.helpers({
    //Return all results of search
    lista: function () {
        return SearchList;
    }
});
Template.List.events({
    'click .secondary-content': function (event, template) {
        MaterializeModal.confirm({
            title: "Confirmar",
            message: "Deseja adicionar esta música ?",
            label: "Confirmar",
            submitLabel: "Confirmar",
            closeLabel: "Cancelar",
            callback: function (error, response) {
                if (error) {
                    MaterializeModal.close();
                    Materialize.toast('Ocorreu um erro, por favor selecione a música novamente.', 3000, 'red');
                } else if (response.submit) {
                    var Video = SearchList[event.target.id];
                    insertVideo(Video.videoId, Video.videoTitle, Video.videoThumb);
                    MaterializeModal.close();
                } else {
                    setTimeout(function () {
                        MaterializeModal.display({
                            bodyTemplate: 'List',
                            closeLabel: 'Fechar'
                        });
                    }, 500);
                    setTimeout(function () {
                        MaterializeModal.display({
                            bodyTemplate: 'List',
                            closeLabel: 'Fechar'
                        });
                    }, 1500);
                }
            }
        });
    }
});