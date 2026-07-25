import 'package:flutter/material.dart';
import '../../core/app_sizes.dart';
import '../../core/theme/app_colors.dart';
import '../../models/chat_message.dart';
import '../../services/api_client.dart';
import '../../services/assistant_service.dart';
import '../../widgets/error_banner.dart';

class _QuickPrompt {
  final String category;
  final String question;
  const _QuickPrompt(this.category, this.question);
}

class AssistantScreen extends StatefulWidget {
  final String? initialScreen;
  const AssistantScreen({super.key, this.initialScreen});

  @override
  State<AssistantScreen> createState() => _AssistantScreenState();
}

class _AssistantScreenState extends State<AssistantScreen> {
  final _controller = TextEditingController();
  final _scrollController = ScrollController();
  final _listKey = GlobalKey<AnimatedListState>();
  final List<ChatMessage> _messages = [
    const ChatMessage(
      role: 'assistant',
      content:
          'Hi, I\'m the Nuzuh Assistant. Ask me how to find a shelter, submit a need, '
          'or what your aid status means — I\'m here to help.',
    ),
  ];
  bool _sending = false;
  String? _error;

  static const _quickPrompts = [
    _QuickPrompt('Shelter', 'How do I find a shelter near me?'),
    _QuickPrompt('Shelter', 'How do I cancel a join request?'),
    _QuickPrompt('Shelter', 'How do I register private housing?'),
    _QuickPrompt('Aid', 'How do I submit a need?'),
    _QuickPrompt('Aid', 'What does "pending" mean for my aid?'),
    _QuickPrompt('Aid', 'What does "in review" mean for my need?'),
    _QuickPrompt('Profile', 'How do I add a family member?'),
    _QuickPrompt('Profile', 'How do I complete my profile?'),
  ];

  static const _startingPrompts = [
    'How do I find a shelter near me?',
    'How do I submit a need?',
    'What does "pending" mean for my aid?',
  ];

  @override
  void initState() {
    super.initState();
    // Rebuilds the composer's send-button state as the user types.
    _controller.addListener(() => setState(() {}));
  }

  @override
  void dispose() {
    _controller.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  void _appendMessage(ChatMessage message) {
    final index = _messages.length;
    setState(() => _messages.add(message));
    _listKey.currentState?.insertItem(index, duration: const Duration(milliseconds: 280));
  }

  Future<void> _send([String? text]) async {
    final content = (text ?? _controller.text).trim();
    if (content.isEmpty || _sending) return;

    setState(() => _error = null);
    _appendMessage(ChatMessage(role: 'user', content: content));
    _controller.clear();
    _scrollToBottom();
    await _requestReply();
  }

  Future<void> _retry() async {
    setState(() => _error = null);
    await _requestReply();
  }

  Future<void> _requestReply() async {
    setState(() => _sending = true);
    _scrollToBottom();

    try {
      final reply = await AssistantService.sendMessage(
        _messages,
        screen: widget.initialScreen,
      );
      if (!mounted) return;
      setState(() => _sending = false);
      _appendMessage(ChatMessage(role: 'assistant', content: reply));
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() {
        _sending = false;
        _error = e.statusCode == 429
            ? 'You\'re sending messages a bit fast — please wait a few seconds and try again.'
            : 'Couldn\'t reach the assistant. Check your connection and try again.';
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _sending = false;
        _error = 'Couldn\'t reach the assistant. Check your connection and try again.';
      });
    }
    _scrollToBottom();
  }

  void _showAllPrompts() {
    final s = AppSizes.of(context);
    final categories = _quickPrompts.map((p) => p.category).toSet().toList();

    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (sheetContext) => Container(
        decoration: const BoxDecoration(
          color: AppColors.background,
          borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
        ),
        padding: EdgeInsets.all(s.pagePadding),
        child: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: AppColors.border2,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              SizedBox(height: s.fieldGap),
              Text(
                'Suggested questions',
                style: TextStyle(
                  fontSize: s.bodyLg,
                  fontWeight: FontWeight.w700,
                  color: AppColors.text,
                ),
              ),
              SizedBox(height: s.sectionGap),
              for (final category in categories) ...[
                Text(
                  category,
                  style: TextStyle(
                    fontSize: s.bodySm,
                    fontWeight: FontWeight.w600,
                    color: AppColors.textSubtle,
                    letterSpacing: 0.5,
                  ),
                ),
                SizedBox(height: s.itemGap),
                ..._quickPrompts.where((p) => p.category == category).map(
                      (p) => Padding(
                        padding: EdgeInsets.only(bottom: s.itemGap),
                        child: GestureDetector(
                          onTap: () {
                            Navigator.of(sheetContext).pop();
                            _send(p.question);
                          },
                          child: Container(
                            width: double.infinity,
                            padding: EdgeInsets.symmetric(
                              horizontal: s.fieldGap,
                              vertical: s.itemGap,
                            ),
                            decoration: BoxDecoration(
                              color: AppColors.surface,
                              borderRadius: BorderRadius.circular(s.borderRadius),
                              border: Border.all(color: AppColors.border),
                            ),
                            child: Row(
                              children: [
                                const Icon(Icons.bolt_rounded,
                                    size: 14, color: AppColors.tertiaryForeground),
                                SizedBox(width: s.itemGap),
                                Expanded(
                                  child: Text(
                                    p.question,
                                    style: TextStyle(
                                      fontSize: s.bodySm,
                                      fontWeight: FontWeight.w500,
                                      color: AppColors.text,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
                    ),
                SizedBox(height: s.itemGap),
              ],
            ],
          ),
        ),
      ),
    );
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!_scrollController.hasClients) return;
      _scrollController.animateTo(
        _scrollController.position.maxScrollExtent + 120,
        duration: const Duration(milliseconds: 250),
        curve: Curves.easeOut,
      );
    });
  }

  @override
  Widget build(BuildContext context) {
    final s = AppSizes.of(context);
    final canSend = _controller.text.trim().isNotEmpty && !_sending;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        titleSpacing: 0,
        title: Row(
          children: [
            Container(
              width: 34,
              height: 34,
              margin: EdgeInsets.only(right: s.itemGap),
              decoration: const BoxDecoration(
                color: Colors.white24,
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.auto_awesome_rounded, color: Colors.white, size: 18),
            ),
            const Expanded(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Nuzuh Assistant', style: TextStyle(fontSize: 17)),
                  Text(
                    'Shelter & aid questions',
                    style: TextStyle(fontSize: 11, color: Colors.white70, fontWeight: FontWeight.w400),
                  ),
                ],
              ),
            ),
          ],
        ),
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        actions: [
          IconButton(
            tooltip: 'Suggested questions',
            icon: const Icon(Icons.lightbulb_outline_rounded),
            onPressed: _showAllPrompts,
          ),
        ],
      ),
      resizeToAvoidBottomInset: true,
      body: Column(
        children: [
          Expanded(
            child: AnimatedList(
              key: _listKey,
              controller: _scrollController,
              padding: EdgeInsets.all(s.pagePadding),
              initialItemCount: _messages.length,
              itemBuilder: (context, index, animation) => _AnimatedEntry(
                animation: animation,
                child: _MessageBubble(message: _messages[index], s: s),
              ),
            ),
          ),
          AnimatedSwitcher(
            duration: const Duration(milliseconds: 150),
            child: _sending
                ? Padding(
                    key: const ValueKey('typing'),
                    padding: EdgeInsets.fromLTRB(s.pagePadding, 0, s.pagePadding, s.itemGap),
                    child: const Align(alignment: Alignment.centerLeft, child: _TypingBubble()),
                  )
                : const SizedBox.shrink(key: ValueKey('no-typing')),
          ),
          if (_error != null) ...[
            Padding(
              padding: EdgeInsets.fromLTRB(s.pagePadding, 0, s.pagePadding, s.itemGap / 2),
              child: ErrorBanner(message: _error!),
            ),
            Padding(
              padding: EdgeInsets.fromLTRB(s.pagePadding, 0, s.pagePadding, s.itemGap),
              child: Align(
                alignment: Alignment.centerRight,
                child: TextButton.icon(
                  onPressed: _retry,
                  icon: const Icon(Icons.refresh_rounded, size: 16),
                  label: const Text('Retry'),
                  style: TextButton.styleFrom(foregroundColor: AppColors.secondary),
                ),
              ),
            ),
          ],
          if (_messages.length == 1 && _error == null)
            Padding(
              padding: EdgeInsets.symmetric(horizontal: s.pagePadding),
              child: Align(
                alignment: Alignment.centerLeft,
                child: Wrap(
                  spacing: s.itemGap,
                  runSpacing: s.itemGap,
                  children: _startingPrompts
                      .map(
                        (suggestion) => GestureDetector(
                          onTap: () => _send(suggestion),
                          child: Container(
                            padding: EdgeInsets.symmetric(
                              horizontal: s.fieldGap,
                              vertical: s.itemGap,
                            ),
                            decoration: BoxDecoration(
                              color: AppColors.tertiary,
                              borderRadius: BorderRadius.circular(20),
                              border: Border.all(color: AppColors.border),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                const Icon(Icons.bolt_rounded,
                                    size: 14, color: AppColors.tertiaryForeground),
                                SizedBox(width: s.itemGap / 2),
                                Text(
                                  suggestion,
                                  style: TextStyle(
                                    fontSize: s.caption,
                                    fontWeight: FontWeight.w600,
                                    color: AppColors.tertiaryForeground,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      )
                      .toList(),
                ),
              ),
            ),
          SizedBox(height: s.itemGap),
          _Composer(
            controller: _controller,
            canSend: canSend,
            onSend: () => _send(),
            s: s,
          ),
        ],
      ),
    );
  }
}

class _AnimatedEntry extends StatelessWidget {
  final Animation<double> animation;
  final Widget child;
  const _AnimatedEntry({required this.animation, required this.child});

  @override
  Widget build(BuildContext context) {
    final curved = CurvedAnimation(parent: animation, curve: Curves.easeOut);
    return SizeTransition(
      sizeFactor: curved,
      alignment: Alignment.topCenter,
      child: FadeTransition(
        opacity: curved,
        child: SlideTransition(
          position: Tween<Offset>(begin: const Offset(0, 0.08), end: Offset.zero)
              .animate(curved),
          child: child,
        ),
      ),
    );
  }
}

class _MessageBubble extends StatelessWidget {
  final ChatMessage message;
  final AppSizes s;
  const _MessageBubble({required this.message, required this.s});

  @override
  Widget build(BuildContext context) {
    final isUser = message.isUser;

    final bubble = Container(
      padding: EdgeInsets.symmetric(
        horizontal: s.fieldGap,
        vertical: s.itemGap,
      ),
      constraints: BoxConstraints(
        maxWidth: MediaQuery.sizeOf(context).width * 0.72,
      ),
      decoration: BoxDecoration(
        color: isUser ? AppColors.secondary : AppColors.surface,
        borderRadius: BorderRadius.only(
          topLeft: Radius.circular(s.cardRadius),
          topRight: Radius.circular(s.cardRadius),
          bottomLeft: Radius.circular(isUser ? s.cardRadius : 2),
          bottomRight: Radius.circular(isUser ? 2 : s.cardRadius),
        ),
      ),
      child: Text(
        message.content,
        style: TextStyle(
          fontSize: s.bodyMd,
          color: isUser ? Colors.white : AppColors.text,
          height: 1.35,
        ),
      ),
    );

    if (isUser) {
      return Padding(
        padding: EdgeInsets.only(bottom: s.itemGap),
        child: Align(alignment: Alignment.centerRight, child: bubble),
      );
    }

    return Padding(
      padding: EdgeInsets.only(bottom: s.itemGap),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.end,
        mainAxisAlignment: MainAxisAlignment.start,
        children: [
          const _AssistantAvatar(),
          SizedBox(width: s.itemGap / 2),
          Flexible(child: bubble),
        ],
      ),
    );
  }
}

class _AssistantAvatar extends StatelessWidget {
  const _AssistantAvatar();

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 26,
      height: 26,
      decoration: const BoxDecoration(
        color: AppColors.tertiary,
        shape: BoxShape.circle,
      ),
      child: const Icon(Icons.auto_awesome_rounded, size: 14, color: AppColors.tertiaryForeground),
    );
  }
}

class _TypingBubble extends StatelessWidget {
  const _TypingBubble();

  @override
  Widget build(BuildContext context) {
    final s = AppSizes.of(context);
    return Row(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.end,
      children: [
        const _AssistantAvatar(),
        SizedBox(width: s.itemGap / 2),
        Container(
          padding: EdgeInsets.symmetric(
            horizontal: s.fieldGap,
            vertical: s.itemGap,
          ),
          decoration: BoxDecoration(
            color: AppColors.surface,
            borderRadius: BorderRadius.circular(s.cardRadius),
          ),
          child: SizedBox(
            width: 16,
            height: 16,
            child: CircularProgressIndicator(
              strokeWidth: 2,
              color: AppColors.secondary,
            ),
          ),
        ),
      ],
    );
  }
}

class _Composer extends StatelessWidget {
  final TextEditingController controller;
  final bool canSend;
  final VoidCallback onSend;
  final AppSizes s;

  const _Composer({
    required this.controller,
    required this.canSend,
    required this.onSend,
    required this.s,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.fromLTRB(
        s.pagePadding,
        0,
        s.pagePadding,
        s.pagePadding,
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          Expanded(
            child: TextField(
              controller: controller,
              autofocus: true,
              minLines: 1,
              maxLines: 4,
              textInputAction: TextInputAction.send,
              onSubmitted: (_) => onSend(),
              style: TextStyle(fontSize: s.bodyMd, color: AppColors.text),
              decoration: const InputDecoration(
                hintText: 'Ask a question…',
              ),
            ),
          ),
          SizedBox(width: s.itemGap),
          GestureDetector(
            onTap: canSend ? onSend : null,
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 150),
              width: s.buttonHeight,
              height: s.buttonHeight,
              decoration: BoxDecoration(
                color: canSend ? AppColors.secondary : AppColors.border,
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.send_rounded, color: Colors.white, size: 20),
            ),
          ),
        ],
      ),
    );
  }
}
