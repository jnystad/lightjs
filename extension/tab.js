$("document").ready(function() {
    function createFile(filename, callback) {
        window.webkitRequestFileSystem (
            window.PERSISTENT,
            1024*1024,
            function (fs) {
                fs.root.getFile(
                    filename,
                    { create: true },
                    function (f) {
                        f.createWriter(
                            function (fw) {
                                callback(fw, f.toURL());
                            },
                            function (e) {
                                console.log("Error creating file writer: " + e.code);
                            }
                        );
                    },
                    function (e) {
                        console.log("Error creating temporary file: " + e.code);
                    }
                );
            },
            function (e) {
                console.log("Error getting file system: " + e.code);
            }
        );
    }

    var fileWriter = null;
    var filePath = null;
    function getFile(filename, callback) {
        if (fileWriter != null) {
            callback(fileWriter, filePath);
        } else {
            createFile(filename, function (fw, path) {
                fileWriter = fw;
                filePath = path
                callback(fileWriter, filePath);
            });
        }
    }

    function writeToFile(filename, data, callback) {
        getFile(filename, function (fw, path) {
            var blob = new Blob([data], { type: 'text/plain' });
            var written = false;

            fw.addEventListener("writeend",
                function () {
                    if (written) {
                        callback(path);
                    } else {
                        written = true;
                        fw.seek(0);
                        fw.write(blob);
                    }
                });
            fw.truncate(0);
        });
    }

    var saveEnabled = false;
    function enableSave() {
        if (saveEnabled) return;
        saveEnabled = true;
        $("#save").removeClass('disabled');
        $("#save").attr('accesskey','s');
        $("#save span").html("Save to file");
    }

    function disableSave() {
        if (!saveEnabled) return;
        saveEnabled = false;
        $("#save").addClass('disabled');
        $("#save").attr('accesskey','');
        $("#save span").html("Run first");
    }

    var jsEditor = ace.edit("jsTextarea");
    jsEditor.setTheme("ace/theme/chrome");
    jsEditor.getSession().setMode("ace/mode/javascript");

    var htmlEditor = ace.edit("htmlTextarea");
    htmlEditor.setTheme("ace/theme/chrome");
    htmlEditor.getSession().setMode("ace/mode/html");

    var cssEditor = ace.edit("cssTextarea");
    cssEditor.setTheme("ace/theme/chrome");
    cssEditor.getSession().setMode("ace/mode/css");

    cssEditor.setValue(
        '@import url(http://fonts.googleapis.com/css?family=Lato:400,700);\n\n' +
        'body {\n' +
        '  background-color: #f0f0f0;\n' +
        '  color: #333;\n' +
        '  font-family: Lato, Helvetica, Arial, sans-serif;\n' +
        '  margin: 25px;\n' +
        '}\n');
    cssEditor.clearSelection();

    jsEditor.setValue("$('document').ready(function() {\n  $('body>h1').html('Activated');\n});");
    jsEditor.clearSelection();

    htmlEditor.setValue("<h1>Heading</h1>\n<p>Awesome copy.</p>");
    htmlEditor.clearSelection();

    cssEditor.getSession().on('change', disableSave);
    jsEditor.getSession().on('change', disableSave);
    htmlEditor.getSession().on('change', disableSave);

    function update() {
        var js = jsEditor.getValue();
        var html = htmlEditor.getValue();
        var css = cssEditor.getValue();
        var framework = $('#framework').val();
        var cssFramework = $('#cssFramework').val();
        var cssFrameworkJs = $('#cssFramework option:selected').attr('data-path-js');

        writeToFile('tabjs-tmp.html',
            '<!DOCTYPE html>\n\n' +
            '<html>\n' +
            '<head>\n' +
            '  <title>Light JavaScript Playground - Export</title>\n' +
            '  <script type="text/javascript" src="' + framework + '"></script>\n' +
            (cssFrameworkJs != null ? '  <script type="text/javascript" src="' + cssFrameworkJs + '"></script>\n' : '') +
            (cssFramework != 'none' ? '  <link rel="stylesheet" href="' + cssFramework + '">\n' : '') +
            '  <style type="text/css">\n' + css + '\n  </style>\n' +
            '</head>\n\n' +
            '<body>\n' +
            html + '\n\n' +
            '<script type="text/javascript">\n' + js + '\n</script>\n' +
            '</body>\n' +
            '</html>\n',
            function (path) {
                $("#output").attr('src', path);
                $('#save').attr('href', path);
            }
        );

        enableSave();
    }

    $('#framework').bind('change', function () {
        var framework = $('#framework option:selected').attr('data-path');
        $('#editor').attr('action','http://jsfiddle.net/api/post/' + framework + '/');
        disableSave();
    });

    $('#cssFramework').bind('change', function () {
        disableSave();
    });

    $('#run').bind('click', function () {
        update();
    });

    $('#fiddle').bind('click', function () {
        $('#htmlVar').val(htmlEditor.getValue());
        $('#cssVar').val(cssEditor.getValue());
        $('#jsVar').val(jsEditor.getValue());

        var cssFramework = $('#cssFramework').val();
        var cssFrameworkJs = $('#cssFramework option:selected').attr('data-path-js');

        if (cssFramework != 'none') {
            var resources = cssFramework;
            if (cssFrameworkJs != null) {
                resources += ',' + cssFrameworkJs;
            }
            $('#resourcesVar').val(resources);
        }

        $('#editor').submit();
    });

    function resizeEditor() {
        var tbHeight = $('#nav').height();
        $('#editor').attr('style','margin-top: -' + tbHeight + 'px; padding-top: ' + tbHeight + 'px');

        cssEditor.resize();
        jsEditor.resize();
        htmlEditor.resize();
    }

    $(window).resize(resizeEditor);
    resizeEditor();

    update();
});
